import type { DashboardStats } from "@/types";

import { get } from "./client";

export const getDashboard = async (): Promise<DashboardStats> => {
  const data = await get<Record<string, unknown>>(
    "/admin/dashboard",
    undefined,
    "dashboard",
  );

  // If already in contract format (events is an object with total):
  if (
    data &&
    typeof data.events === "object" &&
    data.events !== null &&
    "total" in data.events
  ) {
    return data as unknown as DashboardStats;
  }

  // Otherwise, safely map legacy/mock flat integers into DashboardStats
  const raw = data ?? {};
  const eventsNum = typeof raw.events === "number" ? raw.events : 0;
  const announcementsNum =
    typeof raw.announcements === "number" ? raw.announcements : 0;
  const usersNum =
    typeof raw.users === "number"
      ? raw.users
      : typeof (raw.users as Record<string, unknown>)?.total === "number"
        ? ((raw.users as Record<string, unknown>).total as number)
        : 0;
  const bookingsNum = typeof raw.bookings === "number" ? raw.bookings : 0;
  const pendingBookingsNum =
    typeof raw.pendingBookings === "number" ? raw.pendingBookings : 0;
  const pendingContactsNum =
    typeof raw.pendingContacts === "number"
      ? raw.pendingContacts
      : typeof (raw.contactMessages as Record<string, unknown>)?.new === "number"
        ? ((raw.contactMessages as Record<string, unknown>).new as number)
        : 0;

  return {
    events:
      typeof raw.events === "object" && raw.events !== null
        ? (raw.events as DashboardStats["events"])
        : { total: eventsNum, published: 0, drafts: 0 },
    announcements:
      typeof raw.announcements === "object" && raw.announcements !== null
        ? (raw.announcements as DashboardStats["announcements"])
        : { total: announcementsNum, published: 0 },
    users: usersNum,
    bookings:
      typeof raw.bookings === "object" && raw.bookings !== null
        ? (raw.bookings as DashboardStats["bookings"])
        : {
            total: bookingsNum,
            pending: pendingBookingsNum,
            confirmed: 0,
            failed: 0,
          },
    contactMessages:
      typeof raw.contactMessages === "object" && raw.contactMessages !== null
        ? (raw.contactMessages as DashboardStats["contactMessages"])
        : { new: pendingContactsNum },
  };
};
