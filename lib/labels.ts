/**
 * Human labels for the API's enum values.
 *
 * The wire format is not the display format: the API speaks "workshops" and
 * "NEW", and putting either straight on screen is how the panel ended up with
 * lowercase event types in one place and SHOUTING statuses in another. Every
 * enum is rendered through here instead.
 */

import type { Role } from "@/types";

/**
 * `type` is free text on the backend, so this is a lookup with a fallback
 * rather than an exhaustive Record — an event carrying an unlisted type shows
 * its raw value instead of vanishing.
 */
export const EVENT_TYPE_LABELS: Record<string, string> = {
  workshops: "Workshops",
  lectures: "Lectures",
  competitions: "Competitions",
  general: "General",
};

export const ROLE_LABELS: Record<Role, string> = {
  USER: "User",
  CA: "Campus ambassador",
  ADMIN: "Admin",
};

/** Same story: `status` on a contact message is free text, not an enum. */
export const CONTACT_STATUS_LABELS: Record<string, string> = {
  NEW: "New",
  IN_PROGRESS: "In progress",
  RESOLVED: "Resolved",
};

export const eventTypeLabel = (type: string): string =>
  EVENT_TYPE_LABELS[type] ?? type;

export const roleLabel = (role: Role): string => ROLE_LABELS[role] ?? role;

export const contactStatusLabel = (status: string): string =>
  CONTACT_STATUS_LABELS[status] ?? status;
