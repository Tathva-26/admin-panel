import type { AdminUser } from "@/types";
import { get } from "./client";

export const getMe = () => get<AdminUser>("/admin/me", undefined, "user");

/**
 * Begins Google sign-in and returns the provider URL to navigate to.
 *
 * The endpoint returns `200 { url, state }` instead of redirecting, so it has to
 * be fetched. `redirect` is where the backend sends the token afterwards; that
 * origin must be in the backend's CORS allowlist or it replies 400.
 */
export const startGoogleAuth = async (): Promise<string> => {
  const data = await get<{ url?: string }>("/auth/google", {
    redirect: `${window.location.origin}/auth/callback`,
  });

  if (!data?.url) {
    throw new Error("Google sign-in did not return a URL.");
  }
  return data.url;
};

export const logout = () => {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem("jwt");
    // Hard navigation on purpose: a soft push would keep the previous admin's
    // data in memory.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = "/login";
  }
};