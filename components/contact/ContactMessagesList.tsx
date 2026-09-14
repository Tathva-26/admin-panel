"use client";

import { useMemo, useState } from "react";

import DataTable, { type Column } from "@/components/common/DataTable";
import DistributionBar, { type Segment } from "@/components/common/DistributionBar";
import SearchInput from "@/components/common/SearchInput";
import { ContactStatusBadge } from "@/components/common/StatusBadge";
import Button from "@/components/ui/Button";
import { Select } from "@/components/ui/Input";
import Pagination from "@/components/ui/Pagination";
import { useCsvExport, type CsvCell } from "@/hooks/useCsvExport";
import { useList } from "@/hooks/useList";
import { listContactMessages } from "@/lib/api/contact";
import { formatDateTime } from "@/lib/format";
import { contactStatusLabel } from "@/lib/labels";
import { asEnum, asText } from "@/lib/params";
import {
  CONTACT_STATUSES,
  ORDERS,
  type ContactMessage,
  type ContactStatus,
} from "@/types";

import ContactMessageModal from "./ContactMessageModal";

/** Same colours the badges use, so the bar and the rows agree. */
const STATUS_TONES: Record<ContactStatus, Segment["tone"]> = {
  NEW: "blue",
  IN_PROGRESS: "amber",
  RESOLVED: "green",
  SPAM: "neutral",
};

const EXPORT_HEADERS = [
  "Topic",
  "Name",
  "Email",
  "Phone",
  "Status",
  "Received",
  "Message",
];

const toExportRow = (message: ContactMessage): CsvCell[] => [
  message.topic,
  message.name,
  message.email,
  message.phone ?? "",
  message.status,
  formatDateTime(message.createdAt),
  message.query,
];

export default function ContactMessagesList() {
  const messages = useList<ContactMessage>(({ page, pageSize, filters }) =>
    listContactMessages({
      page,
      pageSize,
      search: asText(filters.search),
      status: asEnum(filters.status, CONTACT_STATUSES),
      topic: asText(filters.topic),
      email: asText(filters.email),
      sort: asText(filters.sort),
      order: asEnum(filters.order, ORDERS),
    }),
  );

  const [viewing, setViewing] = useState<ContactMessage | null>(null);

  const activeQuery = {
    search: asText(messages.filters.search),
    status: asEnum(messages.filters.status, CONTACT_STATUSES),
    topic: asText(messages.filters.topic),
    email: asText(messages.filters.email),
    sort: asText(messages.filters.sort),
    order: asEnum(messages.filters.order, ORDERS),
  };

  const csv = useCsvExport({
    fetchPage: (page, pageSize) =>
      listContactMessages({ ...activeQuery, page, pageSize }),
    headers: EXPORT_HEADERS,
    toRow: toExportRow,
    filename: "contact-messages",
  });

  const statusSplit: Segment[] = useMemo(
    () =>
      CONTACT_STATUSES.map((status) => ({
        label: contactStatusLabel(status),
        value: messages.items.filter((m) => m.status === status).length,
        tone: STATUS_TONES[status],
      })),
    [messages.items],
  );

  const columns: Column<ContactMessage>[] = [
    {
      key: "topic",
      sortKey: "topic",
      header: "Topic",
      primary: true,
      cell: (message) => (
        <span className="font-medium text-foreground">{message.topic}</span>
      ),
    },
    {
      key: "from",
      header: "From",
      cell: (message) => (
        <div className="min-w-0">
          <p className="truncate text-foreground">{message.name}</p>
          <p className="truncate text-xs text-muted-foreground">
            {message.email}
          </p>
        </div>
      ),
    },
    {
      key: "query",
      header: "Message",
      className: "text-muted-foreground",
      hideOnMobile: true,
      // One line here; the full text is in the modal. A wall of text in a table
      // row makes every other row unreadable.
      cell: (message) => (
        <p className="line-clamp-1 max-w-md">{message.query}</p>
      ),
    },
    {
      key: "status",
      sortKey: "status",
      header: "Status",
      className: "w-32",
      cell: (message) => <ContactStatusBadge status={message.status} />,
    },
    {
      key: "createdAt",
      sortKey: "createdAt",
      header: "Received",
      className: "numeric w-48 text-muted-foreground",
      hideOnMobile: true,
      cell: (message) => formatDateTime(message.createdAt),
    },
    {
      key: "actions",
      header: "",
      className: "w-28",
      isActions: true,
      cell: (message) => (
        <div className="flex justify-end">
          <Button size="sm" variant="ghost" onClick={() => setViewing(message)}>
            View
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <SearchInput
          value={messages.filters.search ?? ""}
          onChange={(value) => messages.setFilter("search", value)}
          placeholder="Search name or message…"
        />

        <Select
          aria-label="Filter by status"
          className="h-9 w-full sm:h-8 sm:w-40"
          value={messages.filters.status ?? ""}
          onChange={(e) => messages.setFilter("status", e.target.value)}
        >
          <option value="">All statuses</option>
          {CONTACT_STATUSES.map((status) => (
            <option key={status} value={status}>
              {contactStatusLabel(status)}
            </option>
          ))}
        </Select>

        <Button
          size="sm"
          className="sm:ml-auto"
          loading={csv.exporting}
          disabled={messages.total === 0}
          onClick={csv.exportCsv}
        >
          Export CSV
        </Button>
      </div>

      {csv.error ? (
        <p className="rounded-md border border-destructive bg-destructive/10 px-3 py-2 text-sm text-destructive">
          Export failed. {csv.error.message}
        </p>
      ) : null}
      {csv.truncated ? (
        <p className="rounded-md border border-warning/40 bg-warning/15 px-3 py-2 text-xs text-warning">
          Export stopped at 2000 rows. Narrow the filters to get the rest.
        </p>
      ) : null}

      {messages.items.length > 0 ? (
        <DistributionBar segments={statusSplit} />
      ) : null}

      <DataTable
        columns={columns}
        rows={messages.items}
        rowKey={(message) => message.id}
        loading={messages.loading}
        error={messages.error}
        onRetry={messages.refetch}
        sort={messages.sort}
        order={messages.order}
        onToggleSort={messages.toggleSort}
        emptyTitle="No messages match"
        emptyDescription="Try clearing the filters."
        footer={
          <Pagination
            page={messages.page}
            pageSize={messages.pageSize}
            total={messages.total}
            totalPages={messages.totalPages}
            onPageChange={messages.setPage}
          />
        }
      />

      {viewing ? (
        <ContactMessageModal
          key={viewing.id}
          message={viewing}
          onClose={() => setViewing(null)}
          onSaved={() => {
            setViewing(null);
            messages.refetch();
          }}
        />
      ) : null}
    </div>
  );
}
