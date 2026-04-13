const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const express = require('express');
const cors = require('cors');
const crypto = require('node:crypto');
const bcrypt = require('bcryptjs');

const { connectDb } = require('./db');
const { signToken, requireAuth, requireRole } = require('./auth');
const User = require('./models/User');
const Employee = require('./models/Employee');
const Task = require('./models/Task');
const LeaveRequest = require('./models/LeaveRequest');

const app = express();
app.use(express.json());
app.use(
  cors({
    origin: '*',
  })
);

function randomId(prefix) {
  return `${prefix}_${crypto.randomUUID()}`;
}

function normalizeEmail(email) {
  return String(email || '')
    .trim()
    .toLowerCase();
}

function isValidEmailShape(emailNorm) {
  // Practical check; full RFC validation is overkill here.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNorm);
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function initialsFromName(name) {
  return String(name || '')
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || '?';
}

// Health (after DB in start(); still useful for load balancers once up)
app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.get('/api/auth/status', async (_req, res) => {
  const count = await User.countDocuments();
  return res.json({ needsFirstManager: count === 0 });
});

/**
 * First-time setup: create the only manager account when no users exist.
 */
app.post('/api/auth/register', async (req, res) => {
  const count = await User.countDocuments();
  if (count > 0) {
    return res.status(403).json({ message: 'Registration is disabled. Sign in as a manager.' });
  }

  const { email, password, name } = req.body || {};
  const emailNorm = normalizeEmail(email);
  const pass = String(password ?? '').trim();
  if (!emailNorm || !pass || !name) {
    return res.status(400).json({ message: 'Email, password, and name are required' });
  }
  if (!isValidEmailShape(emailNorm)) {
    return res.status(400).json({ message: 'Invalid email address' });
  }
  if (pass.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }

  const passwordHash = await bcrypt.hash(pass, 10);
  await User.create({
    email: emailNorm,
    passwordHash,
    role: 'manager',
    name: String(name).trim(),
    employeeId: null,
  });

  return res.status(201).json({ message: 'Manager account created. You can sign in.' });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password, role } = req.body || {};

  if (role !== 'manager' && role !== 'employee') {
    return res.status(400).json({ message: 'Invalid role' });
  }

  const emailNorm = normalizeEmail(email);
  const pass = String(password ?? '').trim();

  if (!emailNorm || !pass) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  if (!isValidEmailShape(emailNorm)) {
    return res.status(400).json({ message: 'Invalid email address' });
  }

  if (pass.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }

  const user = await User.findOne({ email: emailNorm }).select('+passwordHash');
  if (!user || user.role !== role) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  if (!user.passwordHash || typeof user.passwordHash !== 'string') {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  const ok = await bcrypt.compare(pass, user.passwordHash);
  if (!ok) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  if (user.role === 'manager') {
    const tokenUser = {
      sub: String(user._id),
      role: 'manager',
      name: user.name,
      email: user.email,
    };
    const token = signToken(tokenUser);
    return res.json({ token, user: tokenUser });
  }

  if (!user.employeeId) {
    return res.status(401).json({ message: 'Employee profile is not linked' });
  }

  const tokenUser = {
    sub: user.employeeId,
    role: 'employee',
    employeeId: user.employeeId,
    name: user.name,
    email: user.email,
  };
  const token = signToken(tokenUser);
  return res.json({ token, user: tokenUser });
});

app.get('/api/me', requireAuth, async (req, res) => {
  if (req.user.role === 'manager') {
    const initials = initialsFromName(req.user.name);
    return res.json({
      id: req.user.sub,
      name: req.user.name,
      email: req.user.email || '',
      role: 'manager',
      department: '',
      avatar: initials,
      leaveBalance: 0,
    });
  }

  const employee = await Employee.findOne({ id: req.user.employeeId }).lean();
  if (!employee) return res.status(404).json({ message: 'Employee not found' });

  return res.json({
    id: employee.id,
    name: employee.name,
    email: employee.email,
    role: employee.role,
    department: employee.department,
    avatar: employee.avatar || initialsFromName(employee.name),
    leaveBalance: employee.leaveBalance,
  });
});

app.get('/api/employees', requireAuth, requireRole('manager'), async (_req, res) => {
  const employees = await Employee.find().sort({ name: 1 }).lean();
  return res.json({ employees });
});

/**
 * Manager creates an employee profile + login (same email for both).
 */
app.post('/api/employees', requireAuth, requireRole('manager'), async (req, res) => {
  const { name, email, password, department, role: jobRole, leaveBalance } = req.body || {};
  const emailNorm = normalizeEmail(email);
  if (!name || !emailNorm || !password || !department || !jobRole) {
    return res.status(400).json({ message: 'Name, email, password, department, and role are required' });
  }
  if (String(password).length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }

  const taken = await User.findOne({ email: emailNorm });
  if (taken) {
    return res.status(409).json({ message: 'An account with this email already exists' });
  }

  const empEmailTaken = await Employee.findOne({
    email: { $regex: new RegExp(`^${escapeRegex(emailNorm)}$`, 'i') },
  }).lean();
  if (empEmailTaken) {
    return res.status(409).json({ message: 'An employee with this email already exists' });
  }

  const id = randomId('emp');
  const avatar = initialsFromName(name);
  const balance = Number(leaveBalance);
  const leaveBal = Number.isFinite(balance) ? Math.max(0, balance) : 0;

  const passwordHash = await bcrypt.hash(String(password), 10);

  await Employee.create({
    id,
    name: String(name).trim(),
    email: emailNorm,
    role: String(jobRole).trim(),
    department: String(department).trim(),
    avatar,
    leaveBalance: leaveBal,
  });

  try {
    await User.create({
      email: emailNorm,
      passwordHash,
      role: 'employee',
      name: String(name).trim(),
      employeeId: id,
    });
  } catch (err) {
    await Employee.deleteOne({ id });
    if (err && err.code === 11000) {
      return res.status(409).json({ message: 'An account with this email already exists' });
    }
    throw err;
  }

  const employee = await Employee.findOne({ id }).lean();
  return res.status(201).json({ employee });
});

app.get('/api/tasks', requireAuth, async (req, res) => {
  const filter =
    req.user.role === 'manager' ? {} : { assignedToId: req.user.employeeId };

  const tasks = await Task.find(filter).lean();
  return res.json({ tasks });
});

app.post('/api/tasks', requireAuth, requireRole('manager'), async (req, res) => {
  const { title, assignedToId, priority, deadline, description } = req.body || {};
  if (!title || !assignedToId || !priority || !deadline) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const employee = await Employee.findOne({ id: assignedToId }).lean();
  if (!employee) return res.status(400).json({ message: 'Invalid assignedToId' });

  const id = randomId('task');

  const task = await Task.create({
    id,
    title,
    assignedTo: employee.name,
    assignedToId,
    priority,
    deadline,
    status: 'Pending',
    description: description || '',
  });

  return res.status(201).json({ task });
});

app.patch('/api/tasks/:id/status', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body || {};

  if (!status) return res.status(400).json({ message: 'Missing status' });

  const task = await Task.findOne({ id });
  if (!task) return res.status(404).json({ message: 'Task not found' });
  if (req.user.role === 'employee' && task.assignedToId !== req.user.employeeId) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  task.status = status;
  await task.save();
  return res.json({ task: task.toObject() });
});

app.get('/api/leave-requests', requireAuth, async (req, res) => {
  const filter =
    req.user.role === 'manager' ? {} : { employeeId: req.user.employeeId };

  const leaveRequests = await LeaveRequest.find(filter).lean();
  return res.json({ leaveRequests });
});

app.post('/api/leave-requests', requireAuth, requireRole('employee'), async (req, res) => {
  const { fromDate, toDate, reason } = req.body || {};
  if (!fromDate || !toDate || !reason) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const employee = await Employee.findOne({ id: req.user.employeeId }).lean();
  if (!employee) return res.status(404).json({ message: 'Employee not found' });

  const id = randomId('leave');

  const leaveRequest = await LeaveRequest.create({
    id,
    employeeId: employee.id,
    employeeName: employee.name,
    fromDate,
    toDate,
    reason,
    status: 'Pending',
    appliedOn: new Date().toISOString().split('T')[0],
  });

  return res.status(201).json({ leaveRequest });
});

app.patch('/api/leave-requests/:id/status', requireAuth, requireRole('manager'), async (req, res) => {
  const { id } = req.params;
  const { status } = req.body || {};
  if (!status) return res.status(400).json({ message: 'Missing status' });

  const leaveRequest = await LeaveRequest.findOne({ id });
  if (!leaveRequest) return res.status(404).json({ message: 'Leave request not found' });

  leaveRequest.status = status;
  await leaveRequest.save();

  return res.json({ leaveRequest: leaveRequest.toObject() });
});

const PORT = process.env.PORT || 4000;

async function start() {
  await connectDb();

  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`[backend] listening on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('[backend] Failed to start (is MongoDB running?)', err?.message || err);
  process.exit(1);
});
