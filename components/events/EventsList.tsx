"use client";

import { useState } from "react";

import BulkActionBar from "@/components/common/BulkActionBar";
import DataTable, { type Column, type RowKey } from "@/components/common/DataTable";
import SearchInput from "@/components/common/SearchInput";
import { PublishedBadge } from "@/components/common/StatusBadge";
import Button from "@/components/ui/Button";
import { Select } from "@/components/ui/Input";
import Pagination from "@/components/ui/Pagination";
import { useList } from "@/hooks/useList";
import { listEvents, publishEvent, unpublishEvent } from "@/lib/api/events";
import { toApiError } from "@/lib/api/errors";
import { downloadCsv, timestampedFilename, toCsv } from "@/lib/csv";
import { formatDateTime, formatInr, paiseToRupeeInput } from "@/lib/format";
import { asBool, asEnum, asText } from "@/lib/params";
import { EVENT_TYPES, type AdminEvent } from "@/types";

const COLUMNS: Column<AdminEvent>[] = [
  {
    key: "id",
    header: "ID",
    className: "numeric w-16 text-zinc-400",
    hideOnMobile: true,
    cell: (event) => event.id,
  },
  {
    key: "heading",
    header: "Event",
    primary: true,
    cell: (event) => (
      <div className="min-w-0">
        <p className="truncate font-medium text-zinc-900">{event.heading}</p>
        {event.venue ? (
          <p className="truncate text-xs text-zinc-500">{event.venue.name}</p>
        ) : null}
      </div>
    ),
  },
  {
    key: "type",
    header: "Type",
    className: "w-32 text-zinc-600 capitalize",
    cell: (event) => event.type,
  },
  {
    key: "datetime",
    header: "Starts",
    className: "numeric w-48 text-zinc-600",
    cell: (event) => formatDateTime(event.startTime ?? event.datetime),
  },
  {
    key: "price",
    header: "Price",
    className: "numeric w-28 text-right",
    cell: (event) => formatInr(event.price),
  },
  {
    key: "capacity",
    header: "Capacity",
    className: "numeric w-24 text-right text-zinc-600",
    hideOnMobile: true,
    cell: (event) => event.capacity ?? "—",
  },
  {
    key: "published",
    header: "State",
    className: "w-28",
    cell: (event) => <PublishedBadge published={event.published} />,
  },
];

interface BulkOutcome {
  action: string;
  succeeded: number;
  failures: { id: number; message: string }[];
}

const EXPORT_HEADERS = [
  "ID",
  "Event",
  "Type",
  "State",
  "Starts",
  "Ends",
  "Price (INR)",
  "Capacity",
  "Venue",
  "Committee",
  "Team event",
  "Team size",
];

const toExportRow = (event: AdminEvent) => [
  event.id,
  event.heading,
  event.type,
  event.published ? "Published" : "Draft",
  event.startTime ?? event.datetime
    ? formatDateTime(event.startTime ?? event.datetime)
    : "",
  event.endTime ? formatDateTime(event.endTime) : "",
  // Rupees as a plain decimal, which is what a spreadsheet can sum.
  paiseToRupeeInput(event.price),
  event.capacity ?? "",
  event.venue?.name ?? "",
  event.committee ?? "",
  event.isTeamEvent ? "Yes" : "No",
  event.teamSize ?? "",
];

/** Paged through rather than requested in one go, and capped so a bad `total` cannot spin forever. */
const EXPORT_PAGE_SIZE = 100;
const EXPORT_MAX_ROWS = 2000;

export default function EventsList() {
  const events = useList<AdminEvent>(({ page, pageSize, filters }) =>
    listEvents({
      page,
      pageSize,
      search: asText(filters.search),
      type: asEnum(filters.type, EVENT_TYPES),
      published: asBool(filters.published),
    }),
  );

  const [selected, setSelected] = useState<Set<RowKey>>(new Set());
  const [busy, setBusy] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [outcome, setOutcome] = useState<BulkOutcome | null>(null);

  const activeQuery = {
    search: asText(events.filters.search),
    type: asEnum(events.filters.type, EVENT_TYPES),
    published: asBool(events.filters.published),
  };

  /** Exports everything matching the current filters, not just this page. */
  async function exportCsv() {
    setExporting(true);
    setOutcome(null);

    try {
      const rows: AdminEvent[] = [];
      let page = 1;
      let total = Number.POSITIVE_INFINITY;

      while (rows.length < Math.min(total, EXPORT_MAX_ROWS)) {
        const result = await listEvents({
          ...activeQuery,
          page,
          pageSize: EXPORT_PAGE_SIZE,
        });

        total = result.total;
        if (result.items.length === 0) break;

        rows.push(...result.items);
        page += 1;
      }

      downloadCsv(
        timestampedFilename("events"),
        toCsv(EXPORT_HEADERS, rows.map(toExportRow)),
      );
    } catch (error) {
      setOutcome({
        action: "Export",
        succeeded: 0,
        failures: [{ id: 0, message: toApiError(error).message }],
      });
    } finally {
      setExporting(false);
    }
  }

  // Only act on rows actually on screen. A selection made before paging or
  // filtering should not quietly publish something you can no longer see.
  const targets = events.items.filter((event) => selected.has(event.id));

  async function runBulk(
    action: string,
    call: (id: number) => Promise<unknown>,
  ) {
    const ids = targets.map((event) => event.id);
    if (ids.length === 0) return;

    setBusy(true);
    setOutcome(null);

    // allSettled, not all: one rejected event should not abandon the rest, and
    // the admin needs to know exactly which ones did not go through.
    const results = await Promise.allSettled(ids.map((id) => call(id)));

    const failures = results.flatMap((result, index) =>
      result.status === "rejected"
        ? [{ id: ids[index], message: toApiError(result.reason).message }]
        : [],
    );

    setBusy(false);
    setSelected(new Set());
    setOutcome({ action, succeeded: ids.length - failures.length, failures });
    events.refetch();
  }

  return (
    <div className="space-y-3">
      {/* Stacked on a phone, inline once there is room for it. */}
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <SearchInput
          value={events.filters.search ?? ""}
          onChange={(value) => events.setFilter("search", value)}
          placeholder="Search events…"
        />

        <div className="flex gap-2">
          <Select
            aria-label="Filter by type"
            className="h-9 w-full sm:h-8 sm:w-40"
            value={events.filters.type ?? ""}
            onChange={(e) => events.setFilter("type", e.target.value)}
          >
            <option value="">All types</option>
            {EVENT_TYPES.map((type) => (
              <option key={type} value={type} className="capitalize">
                {type}
              </option>
            ))}
          </Select>

          <Select
            aria-label="Filter by state"
            className="h-9 w-full sm:h-8 sm:w-36"
            value={events.filters.published ?? ""}
            onChange={(e) => events.setFilter("published", e.target.value)}
          >
            <option value="">All states</option>
            <option value="true">Published</option>
            <option value="false">Draft</option>
          </Select>
        </div>

        <Button
          size="sm"
          className="sm:ml-auto"
          loading={exporting}
          disabled={events.total === 0}
          onClick={exportCsv}
        >
          Export CSV
        </Button>
      </div>

      {outcome ? (
        <div
          className={
            outcome.failures.length > 0
              ? "rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800"
              : "rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800"
          }
        >
          <p>
            {outcome.action}: {outcome.succeeded} succeeded
            {outcome.failures.length > 0
              ? `, ${outcome.failures.length} failed`
              : ""}
            .
          </p>
          {outcome.failures.length > 0 ? (
            <ul className="mt-1 list-inside list-disc">
              {outcome.failures.map((failure) => (
                <li key={failure.id} className="numeric text-xs">
                  #{failure.id} — {failure.message}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      <DataTable
        columns={COLUMNS}
        rows={events.items}
        rowKey={(event) => event.id}
        loading={events.loading}
        error={events.error}
        onRetry={events.refetch}
        selectable
        selected={selected}
        onSelectedChange={setSelected}
        emptyTitle="No events match"
        emptyDescription="Try clearing the filters, or add the first event."
        footer={
          <Pagination
            page={events.page}
            pageSize={events.pageSize}
            total={events.total}
            totalPages={events.totalPages}
            onPageChange={events.setPage}
          />
        }
      />

      <BulkActionBar count={targets.length} onClear={() => setSelected(new Set())}>
        <Button
          size="sm"
          variant="primary"
          loading={busy}
          onClick={() => runBulk("Publish", publishEvent)}
        >
          Publish
        </Button>
        <Button
          size="sm"
          loading={busy}
          onClick={() => runBulk("Unpublish", unpublishEvent)}
        >
          Unpublish
        </Button>
      </BulkActionBar>
    </div>
  );
}
