import type { AdminUser } from "@/types";
import { get } from "./client";

export const getMe = () => get<AdminUser>("/admin/me", undefined, "user");
