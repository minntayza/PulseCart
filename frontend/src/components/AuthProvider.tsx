'use client';

import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { AuthUser } from '@/types';
import * as authService from '@/services/authService';

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (username: string, email: string, password: string) => Promise<AuthUser>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setUser(authService.getStoredUser());
      setIsLoading(false);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const authenticated = await authService.login(email, password);
    setUser(authenticated);
    return authenticated;
  }, []);

  const register = useCallback(async (username: string, email: string, password: string) => {
    const authenticated = await authService.register(username, email, password);
    setUser(authenticated);
    return authenticated;
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
  }, []);

  return <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
