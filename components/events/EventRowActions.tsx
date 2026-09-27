"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import ConfirmDialog from "@/components/common/ConfirmDialog";
import Button from "@/components/ui/Button";
import { closeBooking, deleteEvent, openBooking } from "@/lib/api/events";
import { toApiError, type ApiError } from "@/lib/api/errors";
import type { AdminEvent } from "@/types";

interface EventRowActionsProps {
  event: AdminEvent;
  onEdit: (event: AdminEvent) => void;
  onMutated: () => void;
  /** Kept for callers; transition errors now show in the confirm dialog. */
  onError?: (action: string, error: ApiError) => void;
}

export default function EventRowActions({
  event,
  onEdit,
  onMutated,
}: EventRowActionsProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [transitionConfirmOpen, setTransitionConfirmOpen] = useState(false);
  const [transitionError, setTransitionError] = useState<ApiError | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<ApiError | null>(null);
  const [deleting, setDeleting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // TIQR has no event delete, so only a never-synced draft can be removed.
  const canDelete =
    event.status === "DRAFT" && !event.tiqrEventId && !event.ticketId;

  // One-way lifecycle: DRAFT -> OPEN -> CLOSED. A CLOSED event has no action.
  const transition = useMemo(
    () =>
      event.status === "DRAFT"
        ? { label: "Open booking", run: openBooking }
        : event.status === "OPEN"
          ? { label: "Close booking", run: closeBooking }
          : null,
    [event.status],
  );

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  const busy = toggling || deleting;

  const handleConfirmTransition = useCallback(async () => {
    if (!transition) return;
    setToggling(true);
    try {
      await transition.run(event.id);
      setTransitionConfirmOpen(false);
      onMutated();
    } catch (err) {
      setTransitionError(toApiError(err));
    } finally {
      setToggling(false);
    }
  }, [event.id, transition, onMutated]);

  const handleConfirmDelete = useCallback(async () => {
    setDeleting(true);
    try {
      await deleteEvent(event.id);
      setDeleteConfirmOpen(false);
      onMutated();
    } catch (err) {
      setDeleteError(toApiError(err));
    } finally {
      setDeleting(false);
    }
  }, [event.id, onMutated]);

  return (
    <>
      <div className="relative" ref={menuRef}>
        <Button
          size="sm"
          variant="ghost"
          disabled={busy}
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label="Row actions"
          className="h-7 w-7 p-0"
        >
          <svg
            className="h-4 w-4"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <circle cx="10" cy="4" r="1.5" />
            <circle cx="10" cy="10" r="1.5" />
            <circle cx="10" cy="16" r="1.5" />
          </svg>
        </Button>

        {menuOpen ? (
          <div className="absolute right-0 top-full z-30 mt-1 w-40 rounded-md border border-border bg-popover py-1 shadow-lg">
            <button
              type="button"
              className="flex w-full items-center px-3 py-1.5 text-left text-sm text-muted-foreground hover:bg-muted"
              onClick={() => {
                setMenuOpen(false);
                onEdit(event);
              }}
            >
              Edit
            </button>
            {transition ? (
              <button
                type="button"
                className="flex w-full items-center px-3 py-1.5 text-left text-sm text-muted-foreground hover:bg-muted disabled:opacity-50"
                disabled={busy}
                onClick={() => {
                  setMenuOpen(false);
                  setTransitionError(null);
                  setTransitionConfirmOpen(true);
                }}
              >
                {transition.label}
              </button>
            ) : null}
            {canDelete ? (
              <button
                type="button"
                className="flex w-full items-center px-3 py-1.5 text-left text-sm text-red-600 hover:bg-muted disabled:opacity-50"
                disabled={busy}
                onClick={() => {
                  setMenuOpen(false);
                  setDeleteError(null);
                  setDeleteConfirmOpen(true);
                }}
              >
                Delete
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      {transition ? (
        <ConfirmDialog
          open={transitionConfirmOpen}
          title={transition.label}
          description={
            event.status === "DRAFT"
              ? `Open booking for "${event.heading}"? This pushes the event to TIQR and makes it public and bookable. TIQR has no event delete, so this cannot be undone.`
              : `Close booking for "${event.heading}"? Confirm that TIQR bookings are already full. TIQR stops selling on its own once capacity fills, so this only marks the event closed here. It cannot be reopened.`
          }
          confirmLabel={transition.label}
          destructive
          loading={toggling}
          error={transitionError}
          onConfirm={handleConfirmTransition}
          onCancel={() => {
            setTransitionError(null);
            setTransitionConfirmOpen(false);
          }}
        />
      ) : null}

      {canDelete ? (
        <ConfirmDialog
          open={deleteConfirmOpen}
          title="Delete Event"
          description={`Permanently delete "${event.heading}"? This cannot be undone.`}
          confirmLabel="Delete"
          destructive
          loading={deleting}
          error={deleteError}
          onConfirm={handleConfirmDelete}
          onCancel={() => {
            setDeleteError(null);
            setDeleteConfirmOpen(false);
          }}
        />
      ) : null}
    </>
  );
}
