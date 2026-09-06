import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../types';
import { getStoredToken, setStoredToken, apiFetch } from '../services/api';

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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Validate session token on startup
  useEffect(() => {
    const verifySession = async () => {
      const existingToken = getStoredToken();
      if (!existingToken) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await apiFetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          setToken(existingToken);
        } else {
          // Token expired or invalid
          setStoredToken(null);
          setToken(null);
          setUser(null);
        }
      } catch (err) {
        console.warn('Session verification failed:', err);
        setStoredToken(null);
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    verifySession();
  }, []);

  const login = async (email: string, pass: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: pass }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Login failed' }));
      throw new Error(err.error || 'Invalid email or password.');
    }

    const data = await res.json();
    setStoredToken(data.token);
    setToken(data.token);
    setUser(data.user);
  };

  const register = async (email: string, pass: string, name: string) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: pass, name }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Registration failed' }));
      throw new Error(err.error || 'Failed to create account.');
    }

    const data = await res.json();
    setStoredToken(data.token);
    setToken(data.token);
    setUser(data.user);
  };

  const logout = async () => {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Ignore network errors on logout
    }
    setStoredToken(null);
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
