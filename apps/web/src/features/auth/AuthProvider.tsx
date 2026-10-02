import type { ReactNode } from 'react';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, type User } from '@/lib/api';
import { useAuthStore } from '../../stores/authStore';

export interface AuthContextType {
  user: User | null;
  status: 'loading' | 'authenticated' | 'unauthenticated';
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (data: { email: string; username: string; password?: string }) => Promise<void>;
  requestMagicLink: (email: string, redirectTo?: string) => Promise<void>;
  verifyMagicLink: (token: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  updateProfile: (data: { username?: string; avatarUrl?: string | null }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');
  const { setUser, clearAuth, user } = useAuthStore();

  const refresh = useCallback(async () => {
    try {
      const me = await api.getMe();
      setUser(me);
      setStatus('authenticated');
    } catch {
      clearAuth();
      setStatus('unauthenticated');
    }
  }, [setUser, clearAuth]);

  // Initial auth check
  useEffect(() => {
    const initAuth = async () => {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        setStatus('unauthenticated');
        return;
      }

      api.setAccessToken(accessToken);
      
      try {
        const me = await api.getMe();
        setUser(me);
        setStatus('authenticated');
      } catch {
        // Try refresh token
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          try {
            const result = await api.refreshToken(refreshToken);
            localStorage.setItem('accessToken', result.accessToken);
            localStorage.setItem('refreshToken', result.refreshToken);
            api.setAccessToken(result.accessToken);
            
            const me = await api.getMe();
            setUser(me);
            setStatus('authenticated');
            return;
          } catch {
            // Refresh failed
          }
        }
        clearAuth();
        setStatus('unauthenticated');
      }
    };

    initAuth();
  }, [setUser, clearAuth]);

  const login = async (email: string, password: string, rememberMe = false) => {
    const result = await api.login({ email, password, rememberMe });
    localStorage.setItem('accessToken', result.accessToken);
    localStorage.setItem('refreshToken', result.refreshToken);
    if (rememberMe) localStorage.setItem('rememberMe', 'true');
    api.setAccessToken(result.accessToken);
    setUser(result.user);
    setStatus('authenticated');
  };

  const register = async (data: { email: string; username: string; password?: string }) => {
    const result = await api.register(data);
    localStorage.setItem('accessToken', result.accessToken);
    localStorage.setItem('refreshToken', result.refreshToken);
    api.setAccessToken(result.accessToken);
    setUser(result.user);
    setStatus('authenticated');
  };

  const requestMagicLink = async (email: string, redirectTo?: string) => {
    await api.requestMagicLink({ email, redirectTo });
  };

  const verifyMagicLink = async (token: string) => {
    const result = await api.verifyMagicLink(token);
    localStorage.setItem('accessToken', result.accessToken);
    localStorage.setItem('refreshToken', result.refreshToken);
    api.setAccessToken(result.accessToken);
    setUser(result.user);
    setStatus('authenticated');
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch {
      // Ignore logout errors
    } finally {
      clearAuth();
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('rememberMe');
      api.setAccessToken(null);
      setStatus('unauthenticated');
    }
  };

  const updateProfile = async (data: { username?: string; avatarUrl?: string | null }) => {
    const updatedUser = await api.updateProfile(data);
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, status, login, register, requestMagicLink, verifyMagicLink, logout, refresh, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}