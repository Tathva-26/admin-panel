/**
 * Human labels for the API's enum values.
 *
 * The wire format is not the display format: the API speaks "workshops" and
 * "PENDING", and putting either straight on screen is how the panel ended up
 * with lowercase event types in one place and SHOUTING booking statuses in
 * another. Every enum is rendered through here instead.
 *
 * These are Records rather than a generic title-case function on purpose —
 * adding a value to one of the unions fails to compile until it is given a
 * label, which is the point.
 */

import type {
  BookingKind,
  BookingStatus,
  ContactStatus,
  EventType,
  Role,
} from "@/types";

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  workshops: "Workshops",
  lectures: "Lectures",
  competitions: "Competitions",
  general: "General",
};

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  FAILED: "Failed",
  CANCELLED: "Cancelled",
  TIMEOUT: "Timed out",
};

export const BOOKING_KIND_LABELS: Record<BookingKind, string> = {
  EVENT: "Event",
  ACCOMMODATION: "Accommodation",
};

export const CONTACT_STATUS_LABELS: Record<ContactStatus, string> = {
  NEW: "New",
  IN_PROGRESS: "In progress",
  RESOLVED: "Resolved",
  SPAM: "Spam",
};

export const ROLE_LABELS: Record<Role, string> = {
  USER: "User",
  ADMIN: "Admin",
};

/** Falls back to the raw value, so an unknown one shows rather than vanishing. */
export const eventTypeLabel = (type: EventType): string =>
  EVENT_TYPE_LABELS[type] ?? type;

export const bookingStatusLabel = (status: BookingStatus): string =>
  BOOKING_STATUS_LABELS[status] ?? status;

export const bookingKindLabel = (kind: BookingKind): string =>
  BOOKING_KIND_LABELS[kind] ?? kind;

export const roleLabel = (role: Role): string => ROLE_LABELS[role] ?? role;

export const contactStatusLabel = (status: ContactStatus): string =>
  CONTACT_STATUS_LABELS[status] ?? status;
