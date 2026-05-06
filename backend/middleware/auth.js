import jwt from 'jsonwebtoken';

export function requireAdmin(req, _res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return next(Object.assign(new Error('Unauthorized'), { status: 401 }));
  try {
    req.admin = jwt.verify(token, process.env.JWT_SECRET);
    return next();
  } catch {
    return next(Object.assign(new Error('Unauthorized'), { status: 401 }));
  }
}
