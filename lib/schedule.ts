/**
 * Works out what is happening at a venue right now, and what is next.
 *
 * Kept pure and separate from the components so "is this event on?" can be
 * checked directly, rather than only by staring at a table at the right moment.
 */

import type { AdminEvent } from "@/types";

/** An event with a usable start time. Events without one cannot be scheduled. */
export interface Slot {
  event: AdminEvent;
  start: Date;
  /** Null when the event records no end. */
  end: Date | null;
}

export type VenueActivity =
  | { state: "live"; slot: Slot }
  | { state: "next"; slot: Slot }
  | { state: "idle" };

/**
 * An event with no end time is treated as running for this long, so a live
 * event does not vanish the instant it starts.
 */
const ASSUMED_DURATION_MS = 2 * 60 * 60 * 1000;

function toDate(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Turns events into slots, dropping any that cannot be placed on a timeline.
 * `datetime` is the fallback because the contract treats it as the start when
 * `startTime` is absent.
 */
export function toSlots(events: AdminEvent[]): Slot[] {
  return events
    .flatMap((event) => {
      const start = toDate(event.startTime) ?? toDate(event.datetime);
      if (!start) return [];
      return [{ event, start, end: toDate(event.endTime) }];
    })
    .sort((a, b) => a.start.getTime() - b.start.getTime());
}

/** Groups events by the venue they are scheduled at. Unplaced events are skipped. */
export function groupByVenue(events: AdminEvent[]): Map<number, AdminEvent[]> {
  const byVenue = new Map<number, AdminEvent[]>();

  for (const event of events) {
    if (!event.venue) continue;
    const existing = byVenue.get(event.venue.id);
    if (existing) existing.push(event);
    else byVenue.set(event.venue.id, [event]);
  }

  return byVenue;
}

function endOf(slot: Slot): number {
  return slot.end
    ? slot.end.getTime()
    : slot.start.getTime() + ASSUMED_DURATION_MS;
}

/**
 * What this venue is doing at `now`: an event in progress, else the soonest one
 * still to come, else nothing.
 *
 * Only published events count. A draft is not scheduled — showing one as "live"
 * would claim something is happening that the public cannot even see.
 */
export function venueActivity(events: AdminEvent[], now: Date): VenueActivity {
  const slots = toSlots(events.filter((event) => event.published));
  const time = now.getTime();

  const live = slots.find(
    (slot) => slot.start.getTime() <= time && time < endOf(slot),
  );
  if (live) return { state: "live", slot: live };

  const next = slots.find((slot) => slot.start.getTime() > time);
  if (next) return { state: "next", slot: next };

  return { state: "idle" };
}

/** "in 40m", "in 3h", "in 5d" — coarse on purpose; exact times are in the column. */
export function relativeFromNow(target: Date, now: Date): string {
  const minutes = Math.round((target.getTime() - now.getTime()) / 60000);

  if (minutes < 1) return "now";
  if (minutes < 60) return `in ${minutes}m`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `in ${hours}h`;

  return `in ${Math.round(hours / 24)}d`;
}
