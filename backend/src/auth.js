const jwt = require('jsonwebtoken');

function signToken(payload) {
  const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
  const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '2h';
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing Authorization header' });
  }

  const token = header.slice('Bearer '.length);
  const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid/expired token' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    return next();
  };
}

module.exports = { signToken, requireAuth, requireRole };

