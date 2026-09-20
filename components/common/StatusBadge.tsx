import Badge, { type BadgeTone } from "@/components/ui/Badge";
import { contactStatusLabel, roleLabel } from "@/lib/labels";
import type { Role } from "@/types";

/**
 * Colour is decided once, here, so the same state does not end up green on one
 * screen and grey on another.
 */
const ROLE_TONES: Record<Role, BadgeTone> = {
  USER: "neutral",
  CA: "amber",
  ADMIN: "blue",
};

const CONTACT_TONES: Record<string, BadgeTone> = {
  NEW: "amber",
  IN_PROGRESS: "blue",
  RESOLVED: "green",
};

export function PublishedBadge({ published }: { published: boolean }) {
  return (
    <Badge tone={published ? "green" : "neutral"}>
      {published ? "Published" : "Draft"}
    </Badge>
  );
}

export function RoleBadge({ role }: { role: Role }) {
  return <Badge tone={ROLE_TONES[role] ?? "neutral"}>{roleLabel(role)}</Badge>;
}

export function ContactStatusBadge({ status }: { status: string }) {
  return (
    <Badge tone={CONTACT_TONES[status] ?? "neutral"}>
      {contactStatusLabel(status)}
    </Badge>
  );
}

/**
 * An event that is published but has no TIQR ticket is live on the public site
 * and unbookable — every booking attempt 409s. That is invisible in a list
 * unless it is called out.
 */
export function TiqrBadge({ ticketId }: { ticketId: number | null | undefined }) {
  return ticketId ? (
    <Badge tone="green">Synced</Badge>
  ) : (
    <Badge tone="red">Not synced</Badge>
  );
}
