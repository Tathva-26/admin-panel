import type { AdminMe } from "@/types";
import { get } from "./client";

/**
 * The signed-in admin. Everything under `/api/admin` 401s before routing, so
 * this doubles as the check that the session is both valid and an admin's.
 */
export const getMe = () => get<AdminMe>("/admin/me", undefined, "user");
