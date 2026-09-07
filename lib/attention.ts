/**
 * Cheap consistency checks over events the panel has already loaded.
 *
 * These are the mistakes that are invisible in a list but very visible to a
 * student on the public site — an event published with nowhere to go, a team
 * event that will not let anyone register. Catching them here costs one pass
 * over data we are fetching anyway.
 */

import type { AdminEvent } from "@/types";

export type AttentionSeverity = "warn" | "info";

export interface AttentionItem {
  /** Stable across renders, for list keys. */
  id: string;
  eventId: number;
  heading: string;
  issue: string;
  severity: AttentionSeverity;
}

/** Earliest time an event claims to start, if it gives one at all. */
function startsAt(event: AdminEvent): Date | null {
  const raw = event.startTime ?? event.datetime;
  if (!raw) return null;

  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function findEventIssues(
  events: AdminEvent[],
  now: Date = new Date(),
): AttentionItem[] {
  const items: AttentionItem[] = [];

  const add = (
    event: AdminEvent,
    key: string,
    issue: string,
    severity: AttentionSeverity,
  ) =>
    items.push({
      id: `${event.id}:${key}`,
      eventId: event.id,
      heading: event.heading,
      issue,
      severity,
    });

  for (const event of events) {
    const start = startsAt(event);

    if (event.published && !event.venue) {
      add(event, "venue", "Published with no venue", "warn");
    }

    if (event.published && !start) {
      add(event, "start", "Published with no start time", "warn");
    }

    // The backend requires teamSize for a team event, so anything here is a row
    // that predates the rule or came in through an import.
    if (event.isTeamEvent && (event.teamSize ?? 0) < 2) {
      add(event, "team", "Team event with no team size", "warn");
    }

    if (!event.published && start && start < now) {
      add(event, "stale", "Still a draft, and its date has passed", "info");
    }

    if (event.published && event.isFull) {
      add(event, "full", "Published and marked full", "info");
    }
  }

  // Warnings first, then oldest event id, so the list is stable between loads.
  return items.sort((a, b) => {
    if (a.severity !== b.severity) return a.severity === "warn" ? -1 : 1;
    return a.eventId - b.eventId;
  });
}
