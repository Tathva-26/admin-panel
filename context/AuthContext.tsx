"use client";

import {
  createContext,
  useContext,
  useEffect,
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { getMe } from "@/lib/api/auth";
import { signOut, useSession } from "@/lib/auth-client";
import { toApiError, type ApiError } from "@/lib/api/errors";

import type { AdminUser } from "@/types";

interface AuthContextType {
  user: AdminUser | null;
  loading: boolean;
  error: ApiError | null;
  isUnauthorized: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/*
 * Profile result, tagged with the session identity it was loaded for. Deriving
 * the exposed state from the tag (instead of resetting state in an effect)
 * means a different identity can never be shown another identity's profile,
 * and a slow response for an old session cannot leak into a new one.
 */
interface ProfileState {
  forId: string;
  user: AdminUser | null;
  isUnauthorized: boolean;
  error: ApiError | null;
}

async function loadProfile(forId: string): Promise<ProfileState> {
  try {
    const data = await getMe();
    return {
      forId,
      user: data ?? null,
      isUnauthorized: !data || data.role !== "ADMIN",
      error: null,
    };
  } catch (err) {
    const apiErr = toApiError(err);
    const denied = apiErr.status === 403 || apiErr.code === "ADMIN_REQUIRED";
    const signedOut = apiErr.status === 401;
    return {
      forId,
      user: null,
      isUnauthorized: denied,
      error: denied || signedOut ? null : apiErr,
    };
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: sessionData, isPending: sessionPending } = useSession();
  const [profile, setProfile] = useState<ProfileState | null>(null);

  const sessionUserId = sessionData?.user?.id ?? null;

  // Tokens used to live in localStorage. Purge any leftover so an old bearer
  // token cannot outlive the migration and stay readable to page scripts.
  useEffect(() => {
    try {
      window.localStorage.removeItem("jwt");
    } catch {
      // Storage blocked — nothing to purge.
    }
  }, []);

  // (Re)load the admin profile whenever the session identity appears or
  // changes. The session cookie itself is managed by better-auth.
  useEffect(() => {
    if (!sessionUserId) return;
    let cancelled = false;
    void loadProfile(sessionUserId).then((next) => {
      if (!cancelled) setProfile(next);
    });
    return () => {
      cancelled = true;
    };
  }, [sessionUserId]);

  const logout = useCallback(async () => {
    let failed = false;
    try {
      // better-auth resolves with { error } on HTTP failures instead of throwing
      const { error: signOutError } = await signOut();
      failed = !!signOutError;
    } catch {
      failed = true;
    }
    setProfile(null);
    // Hard navigation so no admin data survives in memory. On failure the
    // cookie may still be valid, so say so instead of pretending to sign out.
    window.location.href = failed ? "/login?error=logout_failed" : "/login";
  }, []);

  const current =
    sessionUserId && profile?.forId === sessionUserId ? profile : null;
  const user = current?.user ?? null;
  const isUnauthorized = current?.isUnauthorized ?? false;
  const error = current?.error ?? null;
  const loading = sessionPending || (!!sessionUserId && !current);

  /*
   * Memoised so the provider does not hand out a new object on every render.
   * Without it every useAuth consumer — the shell, the topbar, the callback
   * page — re-renders whenever any piece of auth state changes, even the ones
   * that only read `user`.
   */
  const value = useMemo(
    () => ({ user, loading, error, isUnauthorized, logout }),
    [user, loading, error, isUnauthorized, logout],
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
