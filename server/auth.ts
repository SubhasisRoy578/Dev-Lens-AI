import crypto from 'crypto';
import type { Request, Response, NextFunction } from 'express';
import type { User } from '../src/types';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
const publishableKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || (!serviceRoleKey && !publishableKey)) {
  throw new Error('Supabase authentication is not configured.');
}

const admin = createClient(supabaseUrl, serviceRoleKey || publishableKey!, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const publicClient = createClient(supabaseUrl, publishableKey || serviceRoleKey!, {
  auth: { autoRefreshToken: false, persistSession: false },
});

export interface AuthenticatedRequest extends Request { user?: User; }

function toPublicUser(user: { id: string; email?: string | null; user_metadata?: Record<string, unknown>; created_at?: string }): User {
  return {
    id: user.id,
    email: user.email || '',
    name: String(user.user_metadata?.name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'),
    createdAt: user.created_at || new Date().toISOString(),
  };
}

export function loadAuthFromDisk() {}

export async function registerUser(email: string, pass: string, name: string): Promise<{ user: User; token: string }> {
  const normalizedEmail = email.toLowerCase().trim();
  if (!normalizedEmail || !normalizedEmail.includes('@')) throw new Error('Please provide a valid email address.');
  if (!pass || pass.length < 6) throw new Error('Password must be at least 6 characters long.');

  const { data, error } = await admin.auth.admin.createUser({
    email: normalizedEmail,
    password: pass,
    email_confirm: true,
    user_metadata: { name: name?.trim() || normalizedEmail.split('@')[0] },
  });
  if (error || !data.user) {
    if (error?.message?.toLowerCase().includes('already')) throw new Error('An account with this email address already exists. Please log in.');
    throw new Error(error?.message || 'Unable to create account.');
  }

  const { data: sessionData, error: sessionError } = await publicClient.auth.signInWithPassword({ email: normalizedEmail, password: pass });
  if (sessionError || !sessionData.session) throw new Error('Account created, but automatic login failed. Please sign in.');
  return { user: toPublicUser(data.user), token: sessionData.session.access_token };
}

export async function loginUser(email: string, pass: string): Promise<{ user: User; token: string }> {
  const { data, error } = await publicClient.auth.signInWithPassword({ email: email.toLowerCase().trim(), password: pass });
  if (error || !data.session || !data.user) throw new Error('Invalid email or password.');
  return { user: toPublicUser(data.user), token: data.session.access_token };
}

export async function getUserByToken(token: string): Promise<User | null> {
  if (!token) return null;
  const { data, error } = await admin.auth.getUser(token);
  return error || !data.user ? null : toPublicUser(data.user);
}

export async function logoutUser(_token: string) {}

export async function authMiddleware(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7).trim() : String(req.headers['x-auth-token'] || '').trim();
    if (token) req.user = (await getUserByToken(token)) || undefined;
  } catch (error) {
    console.warn('[v0] Supabase session validation failed:', error);
  }
  next();
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) return res.status(401).json({ error: 'Authentication required. Please log in.' });
  next();
}
