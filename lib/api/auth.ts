import type { AdminUser } from "@/types";
import { API_ORIGIN, get } from "./client";

export const getMe = () => get<AdminUser>("/admin/me", undefined, "user");

export const getGoogleAuthUrl = () => {
  return `${API_ORIGIN}/api/auth/google`;
};

export const logout = () => {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem("jwt");
    // A hard navigation on purpose: signing out should drop every bit of React
    // state holding the previous admin's data, which router.push would keep.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = "/login";
  }
};
