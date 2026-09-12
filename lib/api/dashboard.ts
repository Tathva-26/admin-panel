import type { DashboardStats } from "@/types";

import { get } from "./client";

interface BackendDashboard {
  users: number;
  events: number;
  venues: number;
  bookings: number;
  announcements: number;
  contacts: number;
  roomBookings: number;
  pendingBookings: number;
  pendingContacts: number;
}

export const getDashboard = async (): Promise<DashboardStats> => {
  const dashboard = await get<BackendDashboard>(
    "/admin/dashboard",
    undefined,
    "dashboard",
  );

  return {
    events: { total: dashboard.events, published: 0, drafts: 0 },
    announcements: { total: dashboard.announcements, published: 0 },
    users: dashboard.users,
    bookings: {
      total: dashboard.bookings,
      pending: dashboard.pendingBookings,
      confirmed: 0,
      failed: 0,
    },
    contactMessages: { new: dashboard.pendingContacts },
  };
};
