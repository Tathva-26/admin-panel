import type { AdminUser } from "@/types";
import { get } from "./client";

export const getMe = () => get<AdminUser>("/admin/me", undefined, "user");

export const getGoogleAuthUrl = () => {
  const origin = process.env.NEXT_PUBLIC_API_URL ?? "";
  return `${origin}/api/auth/google`;
};

export const logout = () => {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem("jwt");
    window.location.href = "/login";
  }
};
