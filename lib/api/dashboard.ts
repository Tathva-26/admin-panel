import type { DashboardStats } from "@/types";

import { get } from "./client";

interface BackendDashboard {
  users: number;
  events: number;
  eventStatus: { DRAFT: number; OPEN: number; CLOSED: number };
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
    events: {
      total: dashboard.events,
      open: dashboard.eventStatus?.OPEN ?? 0,
      closed: dashboard.eventStatus?.CLOSED ?? 0,
      drafts: dashboard.eventStatus?.DRAFT ?? 0,
    },
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
