import type { AdminUser } from "@/types";
import { get } from "./client";

export const getMe = () => get<AdminUser>("/admin/me", undefined, "user");

export const getGoogleAuthUrl = () => {
  const origin = process.env.NEXT_PUBLIC_API_URL ?? "";
  const redirect = `${window.location.origin}/auth/callback`;
  return `${origin}/api/auth/google?redirect=${encodeURIComponent(redirect)}`;
};

/**
 * Asks the backend to start a Google OAuth flow and returns the URL to send
 * the browser to. The backend endpoint returns `{ url, state }` as JSON, so a
 * plain `window.location.href` to it would render the JSON instead of taking
 * the user to Google.
 */
export const startGoogleAuth = async (): Promise<string> => {
  const res = await fetch(getGoogleAuthUrl());
  if (!res.ok) throw new Error("Failed to start Google sign-in");
  const data = (await res.json()) as { url?: string };
  if (!data.url) throw new Error("Google sign-in returned no URL");
  return data.url;
};

export const logout = () => {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem("jwt");
    window.location.href = "/login";
  }
};
