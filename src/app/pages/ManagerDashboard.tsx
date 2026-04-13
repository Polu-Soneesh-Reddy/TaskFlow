import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { CheckSquare, Clock, UserX } from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { apiFetch } from '../api/client';
import type { Employee, LeaveRequest, Task } from '../data/mockData';

type EmployeeApi = Omit<Employee, 'tasksCompleted' | 'tasksInProgress'>;

type TasksRes = { tasks: Task[] };
type EmployeesRes = { employees: EmployeeApi[] };
type LeaveRes = { leaveRequests: LeaveRequest[] };

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function isApprovedLeaveActive(r: LeaveRequest) {
  if (r.status !== 'Approved') return false;
  const t = todayISO();
  return t >= r.fromDate && t <= r.toDate;
}

export default function ManagerDashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<EmployeeApi[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setIsLoading(true);
        setError('');
        const [tRes, eRes, lRes] = await Promise.all([
          apiFetch<TasksRes>('/api/tasks'),
          apiFetch<EmployeesRes>('/api/employees'),
          apiFetch<LeaveRes>('/api/leave-requests'),
        ]);
        if (!mounted) return;
        setTasks(tRes.tasks);
        setEmployees(eRes.employees);
        setLeaveRequests(lRes.leaveRequests);
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : 'Failed to load dashboard');
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'Completed').length;
  const pendingTasks = tasks.filter((t) => t.status === 'Pending').length;
  const inProgressTasks = tasks.filter((t) => t.status === 'In Progress').length;

  const employeesOnLeave = useMemo(() => {
    const ids = new Set(
      leaveRequests.filter(isApprovedLeaveActive).map((r) => r.employeeId)
    );
    return ids.size;
  }, [leaveRequests]);

  const taskStatusData = [
    { name: 'Completed', value: completedTasks, color: '#10B981' },
    { name: 'In Progress', value: inProgressTasks, color: '#F59E0B' },
    { name: 'Pending', value: pendingTasks, color: '#EF4444' },
  ];

  const employeePerformanceData = useMemo(() => {
    return employees.map((emp) => {
      const mine = tasks.filter((t) => t.assignedToId === emp.id);
      return {
        name: emp.name.split(' ')[0],
        completed: mine.filter((t) => t.status === 'Completed').length,
        inProgress: mine.filter((t) => t.status === 'In Progress').length,
      };
    });
  }, [employees, tasks]);

  const recentActivities = useMemo(() => {
    const fromLeave = leaveRequests.map((r) => ({
      id: `leave-${r.id}`,
      user: r.employeeName,
      action: `submitted leave (${r.status})`,
      task: r.reason,
      time: r.appliedOn,
    }));
    const fromTasks = tasks.map((t) => ({
      id: `task-${t.id}`,
      user: t.assignedTo,
      action: `task is ${t.status}`,
      task: t.title,
      time: t.deadline,
    }));
    return [...fromLeave, ...fromTasks].sort((a, b) => b.time.localeCompare(a.time)).slice(0, 8);
  }, [leaveRequests, tasks]);

  if (isLoading) {
    return <div className="p-8 text-gray-600">Loading dashboard…</div>;
  }

  if (error) {
    return <div className="p-8 text-red-600">{error}</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl text-[#1E293B] mb-2">Dashboard</h1>
        <p className="text-gray-600">Welcome back! Here's what's happening with your team.</p>
      </div>

      {employees.length === 0 ? (
        <div className="rounded-lg border border-[#2563EB]/30 bg-[#2563EB]/5 px-4 py-3 text-sm text-[#1E293B]">
          No employees in the database yet.{' '}
          <Link to="/manager/employees" className="font-medium text-[#2563EB] hover:underline">
            Add employees
          </Link>{' '}
          so you can assign tasks and see team metrics.
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-[#2563EB]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-gray-600">Total Tasks</CardTitle>
            <CheckSquare className="w-5 h-5 text-[#2563EB]" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl text-[#1E293B]">{totalTasks}</div>
            <p className="text-xs text-gray-500 mt-1">All assigned tasks</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-gray-600">Completed</CardTitle>
            <CheckSquare className="w-5 h-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl text-[#1E293B]">{completedTasks}</div>
            <p className="text-xs text-gray-500 mt-1">Tasks finished</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-gray-600">Pending Tasks</CardTitle>
            <Clock className="w-5 h-5 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl text-[#1E293B]">{pendingTasks}</div>
            <p className="text-xs text-gray-500 mt-1">Awaiting action</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-gray-600">On Leave</CardTitle>
            <UserX className="w-5 h-5 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl text-[#1E293B]">{employeesOnLeave}</div>
            <p className="text-xs text-gray-500 mt-1">Approved leave today</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Task Distribution by Employee</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={employeePerformanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="name" stroke="#6B7280" />
                <YAxis stroke="#6B7280" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Bar dataKey="completed" fill="#10B981" name="Completed" radius={[8, 8, 0, 0]} />
                <Bar dataKey="inProgress" fill="#F59E0B" name="In Progress" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Task Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={taskStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {taskStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {taskStatusData.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-gray-600">{item.name}</span>
                  </div>
                  <span className="text-[#1E293B]">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-4 pb-4 border-b border-gray-100 last:border-0 last:pb-0"
              >
                <div className="w-10 h-10 rounded-full bg-[#2563EB]/10 flex items-center justify-center flex-shrink-0">
                  <CheckSquare className="w-5 h-5 text-[#2563EB]" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-[#1E293B]">
                    <span className="font-medium">{activity.user}</span> {activity.action}{' '}
                    <span className="font-medium">"{activity.task}"</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
