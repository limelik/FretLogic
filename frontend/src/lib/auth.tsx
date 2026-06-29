import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from './api';
import { readAuth, readGuestMode, writeAuth, writeGuestMode } from './storage';
import type { UserSummary } from '../types';

interface AuthContextValue {
  user: UserSummary | null;
  token: string | null;
  isGuest: boolean;
  loading: boolean;
  login: (payload: { email: string; password: string }) => Promise<void>;
  register: (payload: { displayName: string; email: string; password: string }) => Promise<void>;
  continueAsGuest: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserSummary | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedAuth = readAuth();
    const guestMode = readGuestMode();
    setIsGuest(guestMode);

    if (!storedAuth?.token) {
      setLoading(false);
      return;
    }

    setToken(storedAuth.token);
    api
      .me(storedAuth.token)
      .then((profile) => setUser(profile))
      .catch(() => {
        writeAuth(null);
        setToken(null);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isGuest,
      loading,
      async login(payload) {
        const response = await api.login(payload);
        setToken(response.token);
        setUser(response.user);
        setIsGuest(false);
        writeGuestMode(false);
        writeAuth({ token: response.token });
      },
      async register(payload) {
        const response = await api.register(payload);
        setToken(response.token);
        setUser(response.user);
        setIsGuest(false);
        writeGuestMode(false);
        writeAuth({ token: response.token });
      },
      continueAsGuest() {
        setUser(null);
        setToken(null);
        setIsGuest(true);
        writeGuestMode(true);
        writeAuth(null);
      },
      logout() {
        setUser(null);
        setToken(null);
        setIsGuest(false);
        writeAuth(null);
        writeGuestMode(false);
      },
    }),
    [isGuest, loading, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
