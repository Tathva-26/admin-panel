"use client";

import {
  createContext,
  useContext,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { getMe, logout as apiLogout } from "@/lib/api/auth";
import { toApiError, type ApiError } from "@/lib/api/errors";

import type { AdminUser } from "@/types";

interface AuthContextType {
  user: AdminUser | null;
  loading: boolean;
  error: ApiError | null;
  isUnauthorized: boolean;
  verifySession: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [isUnauthorized, setIsUnauthorized] = useState(false);
  const initialVerificationStarted = useRef(false);

  const verifySession = useCallback(async () => {
    if (typeof window === "undefined") return;
    const token = window.localStorage.getItem("jwt");


    if (!token) {
      setUser(null);
      setIsUnauthorized(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await getMe();
      if (data && data.role === "ADMIN") {
        setUser(data);
        setIsUnauthorized(false);
      } else {
        setUser(data ?? null);
        setIsUnauthorized(true);
      }
    } catch (err) {
      const apiErr = toApiError(err);
      if (apiErr.status === 403 || apiErr.code === "ADMIN_REQUIRED") {
        setIsUnauthorized(true);
      } else if (
        apiErr.status === 401 ||
        apiErr.code === "AUTH_REQUIRED" ||
        apiErr.code === "INVALID_TOKEN" ||
        apiErr.code === "TOKEN_EXPIRED"
      ) {
        window.localStorage.removeItem("jwt");
        setUser(null);
        setIsUnauthorized(false);
      } else {
        setError(apiErr);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialVerificationStarted.current) return;
    initialVerificationStarted.current = true;
    void Promise.resolve().then(verifySession);
  }, [verifySession]);

const logout = useCallback(() => {
  setUser(null);
  setIsUnauthorized(false);
  apiLogout();
}, []);
  /*
   * Memoised so the provider does not hand out a new object on every render.
   * Without it every useAuth consumer — the shell, the topbar, the callback
   * page — re-renders whenever any piece of auth state changes, even the ones
   * that only read `user`.
   */
  const value = useMemo(
    () => ({ user, loading, error, isUnauthorized, verifySession, logout }),
    [user, loading, error, isUnauthorized, verifySession, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
