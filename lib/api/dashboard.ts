import type { DashboardStats } from "@/types";

import { get } from "./client";

export const getDashboard = async (): Promise<DashboardStats> => {
  return await get<DashboardStats>(
    "/admin/dashboard",
    undefined,
    "dashboard", // Note: Depending on whether the actual endpoint wraps it in {"dashboard": {}} or not. The mock returned {"dashboard": ...}, but the contract says it returns the object directly. Actually, the contract doesn't explicitly mention wrapper, but client.ts handles "dashboard" key unwrapping if present.
  );
};
