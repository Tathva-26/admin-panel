"use client";

import { useState } from "react";

import Button from "@/components/ui/Button";
import ErrorState from "@/components/ui/ErrorState";
import Field from "@/components/ui/Field";
import { Input, Textarea } from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import Spinner from "@/components/ui/Spinner";
import { useApi } from "@/hooks/useApi";
import { useMutation } from "@/hooks/useMutation";
import { apiErrorMessage } from "@/lib/api/errors";
import {
  createAnnouncement,
  getAnnouncement,
  updateAnnouncement,
} from "@/lib/api/announcements";
import type { Announcement, AnnouncementInput } from "@/types";

interface AnnouncementFormModalProps {
  open: boolean;
  onClose: () => void;
  announcement?: Announcement | null;
  announcementId?: number | null;
  onSaved: () => void;
}

function blankForm(): AnnouncementInput {
  return {
    title: "",
    content: "",
    published: false,
  };
}

function announcementToForm(a: Announcement): AnnouncementInput {
  return {
    title: a.title,
    content: a.content,
    published: a.published,
  };
}

function AnnouncementFormDialog({
  onClose,
  announcement,
  onSaved,
}: {
  onClose: () => void;
  announcement?: Announcement | null;
  onSaved: () => void;
}) {
  const isEdit = !!announcement;

  const [form, setForm] = useState<AnnouncementInput>(() =>
    announcement ? announcementToForm(announcement) : blankForm(),
  );

  const create = useMutation((body: AnnouncementInput) =>
    createAnnouncement(body),
  );
  const update = useMutation(
    (id: number, body: Partial<AnnouncementInput>) =>
      updateAnnouncement(id, body),
  );

  const mutation = isEdit ? update : create;

  const set = <K extends keyof AnnouncementInput>(
    key: K,
    value: AnnouncementInput[K],
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  async function handleSubmit() {
    if (isEdit && announcement) {
      const original = announcementToForm(announcement);
      const changed: Partial<AnnouncementInput> = {};
      (Object.keys(form) as (keyof AnnouncementInput)[]).forEach((key) => {
        if (form[key] !== original[key]) {
          (changed as Record<string, unknown>)[key] = form[key];
        }
      });

      if (Object.keys(changed).length === 0) {
        onClose();
        return;
      }

      const result = await update.run(announcement.id, changed);
      if (result) {
        onSaved();
        onClose();
      }
    } else {
      const result = await create.run(form);
      if (result) {
        onSaved();
        onClose();
      }
    }
  }

  const fields = mutation.fields;

  return (
    <Modal
      open={true}
      onClose={mutation.loading ? () => {} : onClose}
      title={isEdit ? "Edit Announcement" : "Create Announcement"}
      description={
        isEdit
          ? "Modify the announcement and save."
          : "Write a new announcement. Save as draft first."
      }
      footer={
        <div className="flex w-full items-center justify-end gap-2">
          <Button
            size="sm"
            onClick={onClose}
            disabled={mutation.loading}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            variant="primary"
            loading={mutation.loading}
            onClick={handleSubmit}
          >
            {isEdit ? "Save Changes" : "Create Announcement"}
          </Button>
        </div>
      }
    >
      {mutation.error && mutation.error.issues.length === 0 ? (
        <p className="mb-4 rounded-md border border-destructive bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {apiErrorMessage(mutation.error)}
        </p>
      ) : null}

      <div className="space-y-4">
        <Field label="Title" error={fields.title} required>
          {(props) => (
            <Input
              {...props}
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              maxLength={300}
              placeholder="Registration deadline extended"
            />
          )}
        </Field>

        <Field label="Content" error={fields.content} required>
          {(props) => (
            <Textarea
              {...props}
              value={form.content}
              onChange={(e) => set("content", e.target.value)}
              maxLength={10000}
              placeholder="Write the announcement body…"
              rows={5}
            />
          )}
        </Field>

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="announcement-published"
            checked={form.published ?? false}
            onChange={(e) => set("published", e.target.checked)}
            className="h-4 w-4 rounded border-input accent-primary"
          />
          <label
            htmlFor="announcement-published"
            className="text-sm font-medium text-foreground"
          >
            {isEdit ? "Published" : "Publish immediately"}
          </label>
        </div>
      </div>
    </Modal>
  );
}

function AnnouncementFormLoader({
  announcementId,
  onClose,
  onSaved,
}: {
  announcementId: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const announcementApi = useApi<Announcement>(
    `announcement:${announcementId}`,
    () => getAnnouncement(announcementId),
  );

  if (announcementApi.loading) {
    return (
      <Modal open={true} onClose={onClose} title="Loading Announcement">
        <div className="flex justify-center py-12">
          <Spinner className="h-8 w-8 text-foreground" />
        </div>
      </Modal>
    );
  }

  if (announcementApi.error) {
    return (
      <Modal open={true} onClose={onClose} title="Error Loading Announcement">
        <div className="py-4">
          <ErrorState
            error={announcementApi.error}
            onRetry={announcementApi.refetch}
          />
        </div>
      </Modal>
    );
  }

  if (!announcementApi.data) {
    return null;
  }

  return (
    <AnnouncementFormDialog
      key={`edit-${announcementApi.data.id}`}
      announcement={announcementApi.data}
      onClose={onClose}
      onSaved={onSaved}
    />
  );
}

export default function AnnouncementFormModal({
  open,
  onClose,
  announcement,
  announcementId,
  onSaved,
}: AnnouncementFormModalProps) {
  if (!open) return null;

  if (announcementId) {
    return (
      <AnnouncementFormLoader
        key={`load-${announcementId}`}
        announcementId={announcementId}
        onClose={onClose}
        onSaved={onSaved}
      />
    );
  }

  if (announcement) {
    return (
      <AnnouncementFormDialog
        key={`edit-${announcement.id}`}
        onClose={onClose}
        announcement={announcement}
        onSaved={onSaved}
      />
    );
  }

  return (
    <AnnouncementFormDialog
      key="create"
      onClose={onClose}
      announcement={null}
      onSaved={onSaved}
    />
  );
}
