import type { DashboardStats } from "@/types";

import { get } from "./client";

/**
 * Counts only, and no booking numbers among them — TIQR is the system of
 * record for bookings and this backend stores none.
 */
export const getDashboard = () =>
  get<DashboardStats>("/admin/dashboard", undefined, "dashboard");
