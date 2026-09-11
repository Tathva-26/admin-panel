import type { AdminUser } from "@/types";
import { API_ORIGIN, get } from "./client";

export const getMe = () => get<AdminUser>("/admin/me", undefined, "user");

export const getGoogleAuthUrl = () => {
  const origin = API_ORIGIN.replace(/\/+$/, "");
  const redirect = `${window.location.origin}/auth/callback`;
  return `${origin}/api/auth/google?redirect=${encodeURIComponent(redirect)}`;
};

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