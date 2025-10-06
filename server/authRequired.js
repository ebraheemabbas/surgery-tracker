// server/authRequired.js
import jwt from 'jsonwebtoken';

const TOKEN_NAME = 'token';
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

export default function authRequired(req, res, next) {
  const token = req.cookies?.[TOKEN_NAME];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}
