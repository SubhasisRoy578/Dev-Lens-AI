import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../types';
import { getStoredToken, setStoredToken, apiFetch } from '../services/api';
import { supabase } from '../services/supabase';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (email: string, pass: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
}
const AuthContext = createContext<AuthContextType | undefined>(undefined);
const toUser = (user: { id: string; email?: string; user_metadata?: Record<string, unknown>; created_at?: string }): User => ({
  id: user.id,
  email: user.email || '',
  name: String(user.user_metadata?.name || user.email?.split('@')[0] || 'User'),
  createdAt: user.created_at || new Date().toISOString(),
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const restore = async () => {
      if (supabase) {
        const { data } = await supabase.auth.getSession();
        if (active && data.session) {
          setStoredToken(data.session.access_token); setToken(data.session.access_token); setUser(toUser(data.session.user));
        }
      } else if (getStoredToken()) {
        const res = await apiFetch('/api/auth/me');
        if (active && res.ok) setUser((await res.json()).user);
      }
      if (active) setIsLoading(false);
    };
    restore();
    return () => { active = false; };
  }, []);

  const login = async (email: string, pass: string) => {
    if (!supabase) throw new Error('Authentication service is not configured.');
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error || !data.session) throw new Error(error?.message?.toLowerCase().includes('confirm') ? 'Please confirm your email before signing in.' : 'Invalid email or password.');
    setStoredToken(data.session.access_token); setToken(data.session.access_token); setUser(toUser(data.user));
  };
  const register = async (email: string, pass: string, name: string) => {
    if (!supabase) throw new Error('Authentication service is not configured.');
    const { data, error } = await supabase.auth.signUp({ email, password: pass, options: { data: { name } } });
    if (error) throw new Error(error.message);
    if (!data.session || !data.user) throw new Error('Account created. Check your email to confirm your account, then sign in.');
    setStoredToken(data.session.access_token); setToken(data.session.access_token); setUser(toUser(data.user));
  };
  const logout = async () => { if (supabase) await supabase.auth.signOut(); setStoredToken(null); setToken(null); setUser(null); };
  return <AuthContext.Provider value={{ user, token, isLoading, isAuthenticated: !!user, login, register, logout }}>{children}</AuthContext.Provider>;
};
export function useAuth(): AuthContextType { const context = useContext(AuthContext); if (!context) throw new Error('useAuth must be used within an AuthProvider'); return context; }
