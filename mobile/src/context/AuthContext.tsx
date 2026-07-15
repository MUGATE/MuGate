import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AuthUser, login as loginApi } from '../api/authApi';
import { setUnauthorizedHandler } from '../api/client';
import { clearToken, clearUser, getToken, getUser, setToken, setUser } from '../api/storage';

type AuthContextValue = {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (universityId: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateGpa: (gpa: number | null) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(async () => {
    await clearToken();
    await clearUser();
    setUserState(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setUserState(null);
    });

    (async () => {
      try {
        const token = await getToken();
        if (!token) return;
        const stored = await getUser<AuthUser>();
        if (stored) setUserState(stored);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const login = useCallback(async (universityId: string, password: string) => {
    const { token, user: loggedInUser } = await loginApi(universityId, password);
    await setToken(token);
    await setUser(loggedInUser);
    setUserState(loggedInUser);
  }, []);

  const updateGpa = useCallback(async (gpa: number | null) => {
    setUserState((prev) => {
      if (!prev) return prev;
      const next = { ...prev, gpa };
      void setUser(next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: !!user,
      login,
      logout,
      updateGpa,
    }),
    [user, isLoading, login, logout, updateGpa]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
