"use client";

import { useCallback, useState } from "react";

import ConfirmDialog from "@/components/common/ConfirmDialog";
import RowActionsMenu, {
  type RowAction,
} from "@/components/common/RowActionsMenu";
import { useMutation } from "@/hooks/useMutation";
import { deleteEvent, publishEvent, unpublishEvent } from "@/lib/api/events";
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
  const [unpublishOpen, setUnpublishOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const unpublish = useMutation((id: number) => unpublishEvent(id));
  const remove = useMutation((id: number) => deleteEvent(id));

  const busy = publishing || unpublish.loading || remove.loading;

  // Publishing is additive and easy to undo, so it goes through without a
  // prompt. Unpublishing pulls the event off the public site, so it asks.
  const handlePublish = useCallback(async () => {
    setPublishing(true);
    try {
      await publishEvent(event.id);
      onMutated();
    } catch (err) {
      onError?.("Publish", toApiError(err));
    } finally {
      setPublishing(false);
    }
  }, [event.id, onMutated, onError]);

  const confirmUnpublish = useCallback(async () => {
    const result = await unpublish.run(event.id);
    if (result !== null) {
      setUnpublishOpen(false);
      onMutated();
    }
  }, [event.id, unpublish, onMutated]);

  const confirmDelete = useCallback(async () => {
    const result = await remove.run(event.id);
    if (result !== null) {
      setDeleteOpen(false);
      onMutated();
    }
  }, [event.id, remove, onMutated]);

  const actions: RowAction[] = [
    { label: "Edit", onClick: () => onEdit(event) },
    {
      label: "Publish",
      onClick: handlePublish,
      disabled: event.published,
      disabledReason: "Already published.",
    },
    {
      label: "Unpublish",
      onClick: () => {
        unpublish.reset();
        setUnpublishOpen(true);
      },
      disabled: !event.published,
      disabledReason: "Already a draft.",
    },
    {
      label: "Delete",
      onClick: () => {
        remove.reset();
        setDeleteOpen(true);
      },
      // Permanent, so it stays behind the draft state, matching announcements.
      // An event with bookings is refused by the backend even as a draft.
      disabled: event.published,
      disabledReason: "Unpublish it first — published events can't be deleted.",
      destructive: true,
    },
  ];

  return (
    <>
      <RowActionsMenu actions={actions} busy={busy} />

      <ConfirmDialog
        open={unpublishOpen}
        title="Unpublish event"
        description={`Unpublish "${event.heading}"? It stays here as a draft and comes off the public site.`}
        confirmLabel="Unpublish"
        destructive
        loading={unpublish.loading}
        error={unpublish.error}
        onConfirm={confirmUnpublish}
        onCancel={() => {
          unpublish.reset();
          setUnpublishOpen(false);
        }}
      />

      <ConfirmDialog
        open={deleteOpen}
        title="Delete event"
        description={`Delete "${event.heading}"? This cannot be undone.`}
        confirmLabel="Delete"
        destructive
        loading={remove.loading}
        error={remove.error}
        onConfirm={confirmDelete}
        onCancel={() => {
          remove.reset();
          setDeleteOpen(false);
        }}
      />
    </>
  );
}
