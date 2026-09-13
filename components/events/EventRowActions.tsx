"use client";

import { useCallback, useState } from "react";

import ConfirmDialog from "@/components/common/ConfirmDialog";
import RowActionsMenu, {
  type RowAction,
} from "@/components/common/RowActionsMenu";
import { useMutation } from "@/hooks/useMutation";
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
  const [unpublishOpen, setUnpublishOpen] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const unpublish = useMutation((id: number) => unpublishEvent(id));

  const busy = publishing || unpublish.loading;

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
      onClick: () => {},
      /*
       * There is no hard delete for events. DELETE /admin/events/:id only sets
       * published:false — the same thing Unpublish does — so a "Delete" that
       * appeared to work while leaving the row in place would be a lie. Kept
       * visible but disabled so the gap is legible rather than mysterious.
       */
      disabled: true,
      disabledReason:
        "Not supported yet — the backend can only unpublish events, not delete them.",
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
    </>
  );
}
