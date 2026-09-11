"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import ConfirmDialog from "@/components/common/ConfirmDialog";
import Button from "@/components/ui/Button";
import { useMutation } from "@/hooks/useMutation";
import {
  deleteAnnouncement,
  publishAnnouncement,
  unpublishAnnouncement,
} from "@/lib/api/announcements";
import { toApiError, type ApiError } from "@/lib/api/errors";
import type { Announcement } from "@/types";

interface AnnouncementRowActionsProps {
  announcement: Announcement;
  onEdit: (announcement: Announcement) => void;
  onMutated: () => void;
  onError?: (action: string, error: ApiError) => void;
}

export default function AnnouncementRowActions({
  announcement,
  onEdit,
  onMutated,
  onError,
}: AnnouncementRowActionsProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
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

  const remove = useMutation((id: number) => deleteAnnouncement(id));

  const busy = toggling || remove.loading;

  const handlePublishToggle = useCallback(async () => {
    setMenuOpen(false);
    setToggling(true);
    try {
      if (announcement.published) {
        await unpublishAnnouncement(announcement.id);
      } else {
        await publishAnnouncement(announcement.id);
      }
      onMutated();
    } catch (err) {
      onError?.(
        announcement.published ? "Unpublish" : "Publish",
        toApiError(err),
      );
    } finally {
      setToggling(false);
    }
  }, [announcement, onMutated, onError]);

  const handleDelete = useCallback(async () => {
    const result = await remove.run(announcement.id);
    if (result !== null) {
      setDeleteOpen(false);
      onMutated();
    }
  }, [announcement.id, remove, onMutated]);

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
                onEdit(announcement);
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
              {announcement.published ? "Unpublish" : "Publish"}
            </button>
            <button
              type="button"
              className="flex w-full items-center px-3 py-1.5 text-left text-sm text-destructive hover:bg-destructive/10"
              onClick={() => {
                setMenuOpen(false);
                remove.reset();
                setDeleteOpen(true);
              }}
            >
              Delete
            </button>
          </div>
        ) : null}
      </div>

      <ConfirmDialog
        open={deleteOpen}
        title="Delete Announcement"
        description={`Delete "${announcement.title}"? This cannot be undone.`}
        confirmLabel="Delete"
        destructive
        loading={remove.loading}
        error={remove.error}
        onConfirm={handleDelete}
        onCancel={() => {
          remove.reset();
          setDeleteOpen(false);
        }}
      />
    </>
  );
}
