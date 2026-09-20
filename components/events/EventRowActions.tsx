"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import ConfirmDialog from "@/components/common/ConfirmDialog";
import Button from "@/components/ui/Button";
import { useMutation } from "@/hooks/useMutation";
import {
  archiveEvent,
  publishEvent,
  syncEvent,
  unpublishEvent,
} from "@/lib/api/events";
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
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [toggling, setToggling] = useState(false);
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

  const archive = useMutation((id: number) => archiveEvent(id));

  const busy = toggling || archive.loading;

  /*
   * Publishing also pushes the event to TIQR, which is what creates the ticket
   * that makes it bookable. That push is best-effort: it can fail while the
   * publish itself succeeds, and it reports that in the body rather than by
   * throwing. Left unreported, the event sits live on the public site 409-ing
   * every booking — so a failed sync is raised here as an error even though
   * the request was a 200.
   */
  const handlePublishToggle = useCallback(async () => {
    setMenuOpen(false);
    setToggling(true);
    try {
      if (event.published) {
        await unpublishEvent(event.id);
      } else {
        const result = await publishEvent(event.id);
        if (result.tiqrSync && !result.tiqrSync.ok) {
          onError?.("Publish", {
            status: 0,
            code: "TIQR_SYNC_FAILED",
            message: `Published, but TIQR did not accept it (${result.tiqrSync.error}). It is live and unbookable until a re-sync succeeds.`,
            issues: [],
            detail: result.tiqrSync.detail ?? null,
            retryAfter: null,
          });
        }
      }
      onMutated();
    } catch (err) {
      onError?.(event.published ? "Unpublish" : "Publish", toApiError(err));
    } finally {
      setToggling(false);
    }
  }, [event, onMutated, onError]);

  /** Retry of the TIQR push alone. Idempotent, and resumes a partial sync. */
  const handleSync = useCallback(async () => {
    setMenuOpen(false);
    setToggling(true);
    try {
      await syncEvent(event.id);
      onMutated();
    } catch (err) {
      onError?.("Sync to TIQR", toApiError(err));
    } finally {
      setToggling(false);
    }
  }, [event.id, onMutated, onError]);

  const handleArchive = useCallback(async () => {
    const result = await archive.run(event.id);
    if (result !== null) {
      setArchiveOpen(false);
      onMutated();
    }
  }, [event.id, archive, onMutated]);

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
            {/* Only offered where it can do something: an unsynced event.
                Re-syncing one TIQR already has is a no-op, and TIQR has no
                update endpoint, so edits never propagate either way. */}
            {event.published && !event.ticketId ? (
              <button
                type="button"
                className="flex w-full items-center px-3 py-1.5 text-left text-sm text-muted-foreground hover:bg-muted disabled:opacity-50"
                disabled={busy}
                onClick={handleSync}
              >
                Re-sync to TIQR
              </button>
            ) : null}
            <button
              type="button"
              className="flex w-full items-center px-3 py-1.5 text-left text-sm text-destructive hover:bg-destructive/10"
              onClick={() => {
                setMenuOpen(false);
                archive.reset();
                setArchiveOpen(true);
              }}
            >
              Archive
            </button>
          </div>
        ) : null}
      </div>

      <ConfirmDialog
        open={archiveOpen}
        title="Archive Event"
        description={`Archive "${event.heading}"? This will remove the event from listings.`}
        confirmLabel="Archive"
        destructive
        loading={archive.loading}
        error={archive.error}
        onConfirm={handleArchive}
        onCancel={() => {
          archive.reset();
          setArchiveOpen(false);
        }}
      />
    </>
  );
}
