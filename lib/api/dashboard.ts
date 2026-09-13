import type { DashboardStats } from "@/types";

import { get } from "./client";

/** The backend returns exactly `DashboardStats`, so it is read straight. */
export const getDashboard = () => get<DashboardStats>("/admin/dashboard");
