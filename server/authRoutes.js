import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// reconstruct __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


// Adjust DB path if your app uses a different file
const dbPath = process.env.SQLITE_PATH || path.join(__dirname, 'db.sqlite');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

const router = express.Router();
router.use(cookieParser());

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const TOKEN_NAME = 'token';
const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
};

const getUserByEmail = db.prepare('SELECT * FROM users WHERE email = ?');
const insertUser = db.prepare('INSERT INTO users (email, password_hash) VALUES (?, ?)');

router.post('/signup', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    if (getUserByEmail.get(email)) return res.status(409).json({ error: 'Email already registered' });
    const hash = await bcrypt.hash(password, 12);
    const info = insertUser.run(email, hash);
    const user = { id: info.lastInsertRowid, email };
    const token = jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });
    res.cookie(TOKEN_NAME, token, COOKIE_OPTIONS);
    res.json({ user });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const record = getUserByEmail.get(email);
    if (!record) return res.status(401).json({ error: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, record.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    const user = { id: record.id, email: record.email };
    const token = jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });
    res.cookie(TOKEN_NAME, token, COOKIE_OPTIONS);
    res.json({ user });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie(TOKEN_NAME, { path: '/' });
  res.json({ ok: true });
});

router.get('/me', (req, res) => {
  const token = req.cookies?.[TOKEN_NAME];
  if (!token) return res.json({ user: null });
  try {
    const user = jwt.verify(token, JWT_SECRET);
    res.json({ user });
  } catch {
    res.json({ user: null });
  }
});

export default router;
