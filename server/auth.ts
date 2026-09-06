import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import type { Request, Response, NextFunction } from 'express';
import type { User } from '../src/types';

const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export interface StoredUser {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  salt: string;
  createdAt: string;
}

export interface StoredSession {
  token: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
}

// In-memory stores
let usersStore: Record<string, StoredUser> = {};
let sessionsStore: Record<string, StoredSession> = {};

function saveUsersToDisk() {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(usersStore, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write users.json:', err);
  }
}

function saveSessionsToDisk() {
  try {
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(sessionsStore, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write sessions.json:', err);
  }
}

export function loadAuthFromDisk() {
  if (fs.existsSync(USERS_FILE)) {
    try {
      usersStore = JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
    } catch {
      usersStore = {};
    }
  }

  if (fs.existsSync(SESSIONS_FILE)) {
    try {
      sessionsStore = JSON.parse(fs.readFileSync(SESSIONS_FILE, 'utf-8'));
    } catch {
      sessionsStore = {};
    }
  }

  // Seed default test account if users store is completely empty
  // Allows quick testing or evaluation with predefined credentials
  if (Object.keys(usersStore).length === 0) {
    createDefaultUser('engineer@devlens.internal', 'devlens123', 'Staff Engineer');
  }
}

function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
}

function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

function toPublicUser(user: StoredUser): User {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: user.createdAt,
  };
}

function createDefaultUser(email: string, pass: string, name: string) {
  const salt = crypto.randomBytes(16).toString('hex');
  const passwordHash = hashPassword(pass, salt);
  const id = `usr-${crypto.randomBytes(6).toString('hex')}`;
  const newUser: StoredUser = {
    id,
    email: email.toLowerCase().trim(),
    name,
    passwordHash,
    salt,
    createdAt: new Date().toISOString(),
  };
  usersStore[newUser.id] = newUser;
  saveUsersToDisk();
}

export function registerUser(email: string, pass: string, name: string): { user: User; token: string } {
  const normalizedEmail = email.toLowerCase().trim();
  if (!normalizedEmail || !normalizedEmail.includes('@')) {
    throw new Error('Please provide a valid email address.');
  }

  if (!pass || pass.length < 6) {
    throw new Error('Password must be at least 6 characters long.');
  }

  const existing = Object.values(usersStore).find((u) => u.email === normalizedEmail);
  if (existing) {
    throw new Error('An account with this email address already exists. Please log in.');
  }

  const salt = crypto.randomBytes(16).toString('hex');
  const passwordHash = hashPassword(pass, salt);
  const id = `usr-${Date.now().toString(36)}-${crypto.randomBytes(4).toString('hex')}`;

  const newUser: StoredUser = {
    id,
    email: normalizedEmail,
    name: name?.trim() || normalizedEmail.split('@')[0],
    passwordHash,
    salt,
    createdAt: new Date().toISOString(),
  };

  usersStore[newUser.id] = newUser;
  saveUsersToDisk();

  // Create session (valid for 30 days)
  const token = generateToken();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  sessionsStore[token] = {
    token,
    userId: newUser.id,
    createdAt: new Date().toISOString(),
    expiresAt,
  };
  saveSessionsToDisk();

  return {
    user: toPublicUser(newUser),
    token,
  };
}

export function loginUser(email: string, pass: string): { user: User; token: string } {
  const normalizedEmail = email.toLowerCase().trim();
  const user = Object.values(usersStore).find((u) => u.email === normalizedEmail);

  if (!user) {
    throw new Error('Invalid email or password.');
  }

  const testHash = hashPassword(pass, user.salt);
  if (testHash !== user.passwordHash) {
    throw new Error('Invalid email or password.');
  }

  const token = generateToken();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  sessionsStore[token] = {
    token,
    userId: user.id,
    createdAt: new Date().toISOString(),
    expiresAt,
  };
  saveSessionsToDisk();

  return {
    user: toPublicUser(user),
    token,
  };
}

export function getUserByToken(token: string): User | null {
  if (!token) return null;
  const session = sessionsStore[token];
  if (!session) return null;

  if (new Date(session.expiresAt).getTime() < Date.now()) {
    delete sessionsStore[token];
    saveSessionsToDisk();
    return null;
  }

  const user = usersStore[session.userId];
  if (!user) return null;

  return toPublicUser(user);
}

export function logoutUser(token: string) {
  if (token && sessionsStore[token]) {
    delete sessionsStore[token];
    saveSessionsToDisk();
  }
}

// Augment Express Request
export interface AuthenticatedRequest extends Request {
  user?: User;
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  let token = '';

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else if (req.headers['x-auth-token']) {
    token = String(req.headers['x-auth-token']).trim();
  }

  if (token) {
    const user = getUserByToken(token);
    if (user) {
      req.user = user;
    }
  }

  next();
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }
  next();
}
