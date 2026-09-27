import Badge, { type BadgeTone } from "@/components/ui/Badge";
import { bookingStatusLabel, roleLabel } from "@/lib/labels";
import type { BookingStatus, EventStatus, Role } from "@/types";

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

export function PublishedBadge({ published }: { published: boolean }) {
  return (
    <Badge tone={published ? "green" : "neutral"}>
      {published ? "Published" : "Draft"}
    </Badge>
  );
}

const EVENT_STATUS_BADGES: Record<EventStatus, { tone: BadgeTone; label: string }> = {
  DRAFT: { tone: "neutral", label: "Draft" },
  OPEN: { tone: "green", label: "Open" },
  CLOSED: { tone: "amber", label: "Closed" },
};

export function EventStatusBadge({ status }: { status: EventStatus }) {
  const { tone, label } = EVENT_STATUS_BADGES[status] ?? EVENT_STATUS_BADGES.DRAFT;
  return <Badge tone={tone}>{label}</Badge>;
}

export function RoleBadge({ role }: { role: Role }) {
  return (
    <Badge tone={role === "ADMIN" ? "blue" : "neutral"}>{roleLabel(role)}</Badge>
  );
}
