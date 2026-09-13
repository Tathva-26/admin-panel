import Badge, { type BadgeTone } from "@/components/ui/Badge";
import {
  bookingStatusLabel,
  contactStatusLabel,
  roleLabel,
} from "@/lib/labels";
import type { BookingStatus, ContactStatus, Role } from "@/types";

/**
 * Colour is decided once, here, so the same state does not end up green on one
 * screen and grey on another.
 */
const BOOKING_TONES: Record<BookingStatus, BadgeTone> = {
  PENDING: "amber",
  CONFIRMED: "green",
  FAILED: "red",
  CANCELLED: "neutral",
  TIMEOUT: "neutral",
};

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  return (
    <Badge tone={BOOKING_TONES[status] ?? "neutral"}>
      {bookingStatusLabel(status)}
    </Badge>
  );
}

const CONTACT_TONES: Record<ContactStatus, BadgeTone> = {
  NEW: "blue",
  IN_PROGRESS: "amber",
  RESOLVED: "green",
  SPAM: "neutral",
};

export function ContactStatusBadge({ status }: { status: ContactStatus }) {
  return (
    <Badge tone={CONTACT_TONES[status] ?? "neutral"}>
      {contactStatusLabel(status)}
    </Badge>
  );
}

export function PublishedBadge({ published }: { published: boolean }) {
  return (
    <Badge tone={published ? "green" : "neutral"}>
      {published ? "Published" : "Draft"}
    </Badge>
  );
}

export function RoleBadge({ role }: { role: Role }) {
  // Both admin tiers read as "blue"; the label carries the distinction rather
  // than a new tone, which would mean a new colour token for one badge.
  const tone = role === "USER" ? "neutral" : "blue";
  return <Badge tone={tone}>{roleLabel(role)}</Badge>;
}
