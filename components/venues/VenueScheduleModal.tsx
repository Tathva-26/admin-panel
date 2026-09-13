"use client";

import { PublishedBadge } from "@/components/common/StatusBadge";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { cn } from "@/lib/cn";
import { formatDateTime, formatTime } from "@/lib/format";
import { relativeFromNow, slotState, toSlots } from "@/lib/schedule";
import type { AdminEvent, Venue } from "@/types";

interface VenueScheduleModalProps {
  venue: Venue;
  events: AdminEvent[];
  now: Date;
  onClose: () => void;
}


/**
 * Everything scheduled at one venue, in order, with the current moment marked.
 *
 * Drafts are included here — unlike the live column, where they would falsely
 * claim something is on. In a full schedule an admin needs to see the draft
 * sitting in a slot, precisely because it is the thing they still have to
 * publish.
 */
export default function VenueScheduleModal({
  venue,
  events,
  now,
  onClose,
}: VenueScheduleModalProps) {
  const slots = toSlots(events);
  const undated = events.filter(
    (event) => !event.startTime && !event.datetime,
  );

  return (
    <Modal
      open
      onClose={onClose}
      title={`Schedule — ${venue.name}`}
      description={venue.address ?? venue.location ?? undefined}
      footer={
        <Button size="sm" onClick={onClose}>
          Close
        </Button>
      }
    >
      {slots.length === 0 && undated.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          Nothing is scheduled at this venue yet.
        </p>
      ) : (
        <ol className="space-y-1">
          {slots.map((slot) => {
            const state = slotState(slot, now);

            return (
              <li
                key={slot.event.id}
                className={cn(
                  "flex gap-3 rounded-md border px-3 py-2",
                  state === "live"
                    ? "border-success/40 bg-success/15"
                    : "border-border",
                  state === "past" && "opacity-55",
                )}
              >
                <div className="numeric w-28 shrink-0 text-xs text-muted-foreground">
                  {formatDateTime(slot.start.toISOString())}
                  {slot.end ? (
                    <span className="block text-muted-foreground">
                      to {formatTime(slot.end.toISOString())}
                    </span>
                  ) : null}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {slot.event.heading}
                  </p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {slot.event.type}
                  </p>
                </div>

                <div className="flex shrink-0 flex-col items-end gap-1">
                  <PublishedBadge published={slot.event.published} />
                  {state === "upcoming" ? (
                    <span className="text-[11px] text-muted-foreground">
                      {relativeFromNow(slot.start, now)}
                    </span>
                  ) : null}
                  {state === "live" ? (
                    <span className="text-[11px] font-medium text-success">
                      On now
                    </span>
                  ) : null}
                </div>
              </li>
            );
          })}

          {/* Not a timeline entry — but hiding them would lose the fact that
              these events think they are at this venue. */}
          {undated.map((event) => (
            <li
              key={event.id}
              className="flex items-center gap-3 rounded-md border border-dashed border-warning/40 bg-warning/15 px-3 py-2"
            >
              <span className="w-28 shrink-0 text-xs text-warning">
                No start time
              </span>
              <p className="min-w-0 flex-1 truncate text-sm text-foreground">
                {event.heading}
              </p>
              <PublishedBadge published={event.published} />
            </li>
          ))}
        </ol>
      )}
    </Modal>
  );
}
