'use client';
import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { AuthUser } from '@/types';
import * as authService from '@/services/authService';

interface AuthContextValue {
  user: AuthUser | null;
  accessToken: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (username: string, email: string, password: string) => Promise<authService.AuthResult>;
  logout: () => Promise<void>;
}
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    // In development, clear persisted Supabase session so app starts logged out
    if (process.env.NODE_ENV === 'development') {
      Object.keys(localStorage).filter(k => k.startsWith('sb-')).forEach(k => localStorage.removeItem(k));
    }
    const apply = (result: authService.AuthResult | null) => { if (!active) return; setUser(result?.user ?? null); setAccessToken(result?.accessToken ?? null); setIsLoading(false); };
    void authService.getSession().then(apply).catch(() => apply(null));
    const unsubscribe = authService.subscribe(apply);
    return () => { active = false; unsubscribe(); };
  }, []);

  const login = useCallback(async (email: string, password: string) => { const result = await authService.login(email, password); setUser(result.user); setAccessToken(result.accessToken); return result.user; }, []);
  const register = useCallback(async (username: string, email: string, password: string) => { const result = await authService.register(username, email, password); if (!result.needsEmailConfirmation) { setUser(result.user); setAccessToken(result.accessToken); } return result; }, []);
  const logout = useCallback(async () => { await authService.logout(); setUser(null); setAccessToken(null); }, []);
  return <AuthContext.Provider value={{ user, accessToken, isLoading, login, register, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() { const context = useContext(AuthContext); if (!context) throw new Error('useAuth must be used inside AuthProvider'); return context; }
