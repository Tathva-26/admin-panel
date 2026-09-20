"use client";

import { useState } from "react";

import ConfirmDialog from "@/components/common/ConfirmDialog";
import DataTable, { type Column } from "@/components/common/DataTable";
import SearchInput from "@/components/common/SearchInput";
import { ContactStatusBadge } from "@/components/common/StatusBadge";
import Button from "@/components/ui/Button";
import { Select } from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import Pagination from "@/components/ui/Pagination";
import { useList } from "@/hooks/useList";
import { useMutation } from "@/hooks/useMutation";
import {
  deleteContact,
  listContacts,
  updateContactStatus,
} from "@/lib/api/contacts";
import { formatDateTime } from "@/lib/format";
import { contactStatusLabel } from "@/lib/labels";
import { asText } from "@/lib/params";
import { CONTACT_STATUSES, type Contact } from "@/types";

/**
 * Enquiries from the public contact form.
 *
 * The list endpoint takes `status` and paging only — there is no `search` — so
 * the text box filters the loaded page client-side rather than pretending to
 * be a server query and quietly returning everything.
 */
export default function ContactsList() {
  const contacts = useList<Contact>(({ page, pageSize, filters }) =>
    listContacts({
      page,
      pageSize,
      status: asText(filters.status),
    }),
  );

  const [open, setOpen] = useState<Contact | null>(null);
  const [deleting, setDeleting] = useState<Contact | null>(null);
  const [search, setSearch] = useState("");

  const setStatus = useMutation((id: number, status: string) =>
    updateContactStatus(id, { status }),
  );
  const remove = useMutation((id: number) => deleteContact(id));

  const term = search.trim().toLowerCase();
  const rows = term
    ? contacts.items.filter((contact) =>
        [contact.name, contact.email, contact.topic, contact.query]
          .join(" ")
          .toLowerCase()
          .includes(term),
      )
    : contacts.items;

  async function handleStatusChange(contact: Contact, status: string) {
    if (status === contact.status) return;
    const result = await setStatus.run(contact.id, status);
    if (result) {
      contacts.refetch();
      setOpen((current) =>
        current && current.id === contact.id ? { ...current, status } : current,
      );
    }
  }

  const columns: Column<Contact>[] = [
    {
      key: "from",
      header: "From",
      primary: true,
      cell: (contact) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-foreground">{contact.name}</p>
          <p className="truncate text-xs text-muted-foreground">
            {contact.email}
          </p>
        </div>
      ),
    },
    {
      key: "topic",
      header: "Topic",
      className: "w-40 text-muted-foreground",
      cell: (contact) => contact.topic || "—",
    },
    {
      key: "query",
      header: "Message",
      className: "text-muted-foreground",
      hideOnMobile: true,
      cell: (contact) => (
        <span className="line-clamp-2">{contact.query}</span>
      ),
    },
    {
      key: "phone",
      header: "Phone",
      className: "numeric w-32 text-muted-foreground",
      hideOnMobile: true,
      cell: (contact) => contact.phone || "—",
    },
    {
      key: "status",
      header: "Status",
      className: "w-28",
      cell: (contact) => <ContactStatusBadge status={contact.status} />,
    },
    {
      key: "createdAt",
      header: "Received",
      className: "numeric w-40 text-muted-foreground",
      hideOnMobile: true,
      cell: (contact) => formatDateTime(contact.createdAt),
    },
    {
      key: "actions",
      header: "",
      className: "w-20",
      isActions: true,
      cell: (contact) => (
        <Button
          size="sm"
          className="h-7 px-2.5 text-xs"
          onClick={() => setOpen(contact)}
        >
          Open
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Filter this page…"
        />

        <Select
          aria-label="Filter by status"
          className="h-9 w-full sm:h-8 sm:w-44"
          value={contacts.filters.status ?? ""}
          onChange={(e) => contacts.setFilter("status", e.target.value)}
        >
          <option value="">All statuses</option>
          {CONTACT_STATUSES.map((status) => (
            <option key={status} value={status}>
              {contactStatusLabel(status)}
            </option>
          ))}
        </Select>
      </div>

      {setStatus.error ? (
        <p className="rounded-md border border-destructive bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {setStatus.error.message}
        </p>
      ) : null}

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(contact) => contact.id}
        loading={contacts.loading}
        error={contacts.error}
        onRetry={contacts.refetch}
        cardsBelow="lg"
        emptyTitle="No messages"
        emptyDescription="Enquiries from the public contact form land here."
        footer={
          <Pagination
            page={contacts.page}
            pageSize={contacts.pageSize}
            total={contacts.total}
            totalPages={contacts.totalPages}
            onPageChange={contacts.setPage}
          />
        }
      />

      {open ? (
        <Modal
          open
          onClose={() => setOpen(null)}
          title={open.topic || "Enquiry"}
          description={`${open.name} · ${open.email}${open.phone ? ` · ${open.phone}` : ""}`}
          footer={
            <div className="flex w-full items-center justify-between">
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive"
                onClick={() => {
                  remove.reset();
                  setDeleting(open);
                }}
              >
                Delete
              </Button>
              <Button size="sm" onClick={() => setOpen(null)}>
                Close
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Status</span>
              <Select
                aria-label="Set status"
                className="h-8 w-44"
                value={open.status}
                disabled={setStatus.loading}
                onChange={(e) => handleStatusChange(open, e.target.value)}
              >
                {/* The current value may be a status the backend's free-text
                    field holds but this list does not know about. */}
                {(CONTACT_STATUSES as readonly string[]).includes(open.status)
                  ? null
                  : <option value={open.status}>{open.status}</option>}
                {CONTACT_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {contactStatusLabel(status)}
                  </option>
                ))}
              </Select>
            </div>

            <p className="whitespace-pre-line text-sm text-foreground">
              {open.query}
            </p>

            <p className="text-xs text-muted-foreground">
              Received {formatDateTime(open.createdAt)}
            </p>
          </div>
        </Modal>
      ) : null}

      <ConfirmDialog
        open={!!deleting}
        title="Delete message"
        description={
          deleting
            ? `Delete the enquiry from ${deleting.name}? This one is a real delete — it does not archive.`
            : undefined
        }
        confirmLabel="Delete"
        destructive
        loading={remove.loading}
        error={remove.error}
        onConfirm={async () => {
          if (!deleting) return;
          const result = await remove.run(deleting.id);
          if (result !== null) {
            setDeleting(null);
            setOpen(null);
            contacts.refetch();
          }
        }}
        onCancel={() => {
          remove.reset();
          setDeleting(null);
        }}
      />
    </div>
  );
}
