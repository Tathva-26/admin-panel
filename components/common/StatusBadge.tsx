import Badge, { type BadgeTone } from "@/components/ui/Badge";
import type { BookingStatus, Role } from "@/types";

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
  return <Badge tone={BOOKING_TONES[status] ?? "neutral"}>{status}</Badge>;
}

export function PublishedBadge({ published }: { published: boolean }) {
  return (
    <Badge tone={published ? "green" : "neutral"}>
      {published ? "Published" : "Draft"}
    </Badge>
  );
}

export function RoleBadge({ role }: { role: Role }) {
  return <Badge tone={role === "ADMIN" ? "blue" : "neutral"}>{role}</Badge>;
}
