"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import ConfirmDialog from "@/components/common/ConfirmDialog";
import Button from "@/components/ui/Button";
import { publishEvent, unpublishEvent } from "@/lib/api/events";
import { toApiError, type ApiError } from "@/lib/api/errors";
import type { AdminEvent } from "@/types";

interface EventRowActionsProps {
  event: AdminEvent;
  onEdit: (event: AdminEvent) => void;
  onMutated: () => void;
  onError?: (action: string, error: ApiError) => void;
}

export default function EventRowActions({
  event,
  onEdit,
  onMutated,
  onError,
}: EventRowActionsProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [unpublishConfirmOpen, setUnpublishConfirmOpen] = useState(false);
  const [unpublishError, setUnpublishError] = useState<ApiError | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

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

  const busy = toggling;

  // Unpublishing here only hides the event from our own listings -- it does
  // not touch TIQR (see setEventPublished on the backend), so the convener
  // has to have already closed it there separately, or it stays live and
  // bookable on TIQR regardless of what this panel shows.
  const handlePublishToggle = useCallback(() => {
    setMenuOpen(false);
    if (event.published) {
      setUnpublishError(null);
      setUnpublishConfirmOpen(true);
      return;
    }
    setToggling(true);
    publishEvent(event.id)
      .then(onMutated)
      .catch((err) => onError?.("Publish", toApiError(err)))
      .finally(() => setToggling(false));
  }, [event, onMutated, onError]);

  const handleConfirmUnpublish = useCallback(async () => {
    setToggling(true);
    try {
      await unpublishEvent(event.id);
      setUnpublishConfirmOpen(false);
      onMutated();
    } catch (err) {
      setUnpublishError(toApiError(err));
    } finally {
      setToggling(false);
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
            <button
              type="button"
              className="flex w-full items-center px-3 py-1.5 text-left text-sm text-muted-foreground hover:bg-muted disabled:opacity-50"
              disabled={busy}
              onClick={handlePublishToggle}
            >
              {event.published ? "Unpublish" : "Publish"}
            </button>
          </div>
        ) : null}
      </div>

      <ConfirmDialog
        open={unpublishConfirmOpen}
        title="Unpublish Event"
        description={`Before unpublishing "${event.heading}" here, confirm with the event convener that they have already closed it on TIQR's own admin console. Unpublishing in this panel only hides the event from our local listings — it does not change anything on TIQR, so the event can stay live and bookable there until the convener closes it separately.`}
        confirmLabel="I've confirmed — unpublish"
        destructive
        loading={toggling}
        error={unpublishError}
        onConfirm={handleConfirmUnpublish}
        onCancel={() => {
          setUnpublishError(null);
          setUnpublishConfirmOpen(false);
        }}
      />
    </>
  );
}
