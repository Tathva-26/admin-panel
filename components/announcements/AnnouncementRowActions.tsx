"use client";

import { useCallback, useState } from "react";

import ConfirmDialog from "@/components/common/ConfirmDialog";
import RowActionsMenu, {
  type RowAction,
} from "@/components/common/RowActionsMenu";
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
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [toggling, setToggling] = useState(false);

  const remove = useMutation((id: number) => deleteAnnouncement(id));

  const busy = toggling || remove.loading;

  const setPublished = useCallback(
    async (next: boolean) => {
      setToggling(true);
      try {
        if (next) await publishAnnouncement(announcement.id);
        else await unpublishAnnouncement(announcement.id);
        onMutated();
      } catch (err) {
        onError?.(next ? "Publish" : "Unpublish", toApiError(err));
      } finally {
        setToggling(false);
      }
    },
    [announcement.id, onMutated, onError],
  );

  const handleDelete = useCallback(async () => {
    const result = await remove.run(announcement.id);
    if (result !== null) {
      setDeleteOpen(false);
      onMutated();
    }
  }, [announcement.id, remove, onMutated]);

  const actions: RowAction[] = [
    { label: "Edit", onClick: () => onEdit(announcement) },
    {
      label: "Publish",
      onClick: () => setPublished(true),
      disabled: announcement.published,
      disabledReason: "Already published.",
    },
    {
      label: "Unpublish",
      onClick: () => setPublished(false),
      disabled: !announcement.published,
      disabledReason: "Already a draft.",
    },
    {
      label: "Delete",
      onClick: () => {
        remove.reset();
        setDeleteOpen(true);
      },
      // Deletion is permanent here (the backend really does drop the row), so
      // it stays behind the draft state — unpublish first, then delete.
      disabled: announcement.published,
      disabledReason: "Unpublish it first — published announcements can't be deleted.",
      destructive: true,
    },
  ];

  return (
    <>
      <RowActionsMenu actions={actions} busy={busy} />

      <ConfirmDialog
        open={deleteOpen}
        title="Delete announcement"
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
