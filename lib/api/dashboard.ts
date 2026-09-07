import type { DashboardStats } from "@/types";

import { get } from "./client";

export const getDashboard = () => get<DashboardStats>("/admin/dashboard");
