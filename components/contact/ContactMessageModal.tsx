"use client";

import { useState } from "react";

import { ContactStatusBadge } from "@/components/common/StatusBadge";
import Button from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import { Select } from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import { useMutation } from "@/hooks/useMutation";
import { updateContactStatus } from "@/lib/api/contact";
import { formatDateTime } from "@/lib/format";
import { contactStatusLabel } from "@/lib/labels";
import { CONTACT_STATUSES, type ContactMessage, type ContactStatus } from "@/types";

interface ContactMessageModalProps {
  message: ContactMessage;
  onClose: () => void;
  onSaved: () => void;
}

/**
 * Mounted only while a message is selected, and keyed by id in the parent, so
 * the picker resets by remounting rather than by syncing state in an effect.
 *
 * Status is the only editable field: the body of an enquiry is what someone
 * actually sent, and the panel has no business rewriting it.
 */
export default function ContactMessageModal({
  message,
  onClose,
  onSaved,
}: ContactMessageModalProps) {
  const [status, setStatus] = useState<ContactStatus | "">("");
  const update = useMutation((id: number, next: ContactStatus) =>
    updateContactStatus(id, { status: next }),
  );

  async function submit() {
    if (!status) return;
    const updated = await update.run(message.id, status);
    if (updated) onSaved();
  }

  return (
    <Modal
      open
      onClose={update.loading ? () => {} : onClose}
      title={message.topic}
      description={`From ${message.name}`}
      footer={
        <>
          <Button size="sm" onClick={onClose} disabled={update.loading}>
            Cancel
          </Button>
          <Button
            size="sm"
            variant="primary"
            loading={update.loading}
            disabled={!status || status === message.status}
            onClick={submit}
          >
            Update status
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        {update.error ? (
          <p className="rounded-md border border-destructive bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {update.error.message}
          </p>
        ) : null}

        <dl className="grid grid-cols-2 gap-y-2 rounded-md border border-border bg-muted px-3 py-2.5 text-sm">
          <dt className="text-muted-foreground">Email</dt>
          <dd className="truncate text-right">
            <a
              href={`mailto:${message.email}`}
              className="text-info underline-offset-2 hover:underline"
            >
              {message.email}
            </a>
          </dd>

          <dt className="text-muted-foreground">Phone</dt>
          <dd className="numeric truncate text-right text-foreground">
            {message.phone ?? "—"}
          </dd>

          <dt className="text-muted-foreground">Received</dt>
          <dd className="numeric text-right text-foreground">
            {formatDateTime(message.createdAt)}
          </dd>

          {/* Only worth showing once it differs from receipt, which is the
              signal that someone has actually handled this. */}
          {message.updatedAt !== message.createdAt ? (
            <>
              <dt className="text-muted-foreground">Last updated</dt>
              <dd className="numeric text-right text-foreground">
                {formatDateTime(message.updatedAt)}
              </dd>
            </>
          ) : null}

          <dt className="text-muted-foreground">Current</dt>
          <dd className="text-right">
            <ContactStatusBadge status={message.status} />
          </dd>
        </dl>

        <div className="rounded-md border border-border px-3 py-2.5">
          <p className="mb-1 text-xs font-medium text-muted-foreground">
            Message
          </p>
          {/* whitespace-pre-wrap: the sender's line breaks are part of what
              they wrote, and collapsing them makes long enquiries unreadable. */}
          <p className="whitespace-pre-wrap break-words text-sm text-foreground">
            {message.query}
          </p>
        </div>

        <Field
          label="Change status to"
          hint="Any status can follow any other; the backend enforces no order here."
        >
          {(props) => (
            <Select
              {...props}
              value={status}
              onChange={(e) => setStatus(e.target.value as ContactStatus | "")}
            >
              <option value="">Leave unchanged</option>
              {CONTACT_STATUSES.filter(
                (option) => option !== message.status,
              ).map((option) => (
                <option key={option} value={option}>
                  {contactStatusLabel(option)}
                </option>
              ))}
            </Select>
          )}
        </Field>
      </div>
    </Modal>
  );
}
