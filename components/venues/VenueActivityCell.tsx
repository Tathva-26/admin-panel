"use client";

import Spinner from "@/components/ui/Spinner";
import { formatDateTime, formatTime } from "@/lib/format";
import { relativeFromNow, venueActivity } from "@/lib/schedule";
import type { AdminEvent } from "@/types";

interface VenueActivityCellProps {
  events: AdminEvent[];
  now: Date;
  loading: boolean;
}

/**
 * What this venue is doing, right now.
 *
 * The live case gets a pulsing dot because it is the one thing on the page that
 * is true only at this moment — everything else is a record, this is a status.
 */
export default function VenueActivityCell({
  events,
  now,
  loading,
}: VenueActivityCellProps) {
  // Before the first clock tick there is no meaningful "now", so showing
  // "nothing scheduled" would be a guess rather than an answer.
  if (loading || now.getTime() === 0) {
    return <Spinner className="h-3.5 w-3.5 text-muted-foreground" />;
  }

  const activity = venueActivity(events, now);

  if (activity.state === "idle") {
    return <span className="text-xs text-muted-foreground">Nothing scheduled</span>;
  }

  const { event, start, end } = activity.slot;

  if (activity.state === "live") {
    return (
      <div className="min-w-0">
        <p className="flex items-center gap-1.5 text-xs font-medium text-success">
          <span className="relative flex h-1.5 w-1.5 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success" />
          </span>
          On now
        </p>
        <p className="truncate text-sm text-foreground">{event.heading}</p>
        {end ? (
          <p className="numeric text-xs text-muted-foreground">
            until {formatTime(end.toISOString())}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground">
        Next &middot;{" "}
        <span className="text-muted-foreground">{relativeFromNow(start, now)}</span>
      </p>
      <p className="truncate text-sm text-foreground">{event.heading}</p>
      <p className="numeric text-xs text-muted-foreground">
        {formatDateTime(start.toISOString())}
      </p>
    </div>
  );
}
