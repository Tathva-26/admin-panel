"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import BulkActionBar from "@/components/common/BulkActionBar";
import DataTable, { type Column, type RowKey } from "@/components/common/DataTable";
import SearchInput from "@/components/common/SearchInput";
import { PublishedBadge } from "@/components/common/StatusBadge";
import Button from "@/components/ui/Button";
import { Select } from "@/components/ui/Input";
import Pagination from "@/components/ui/Pagination";
import { useCsvExport } from "@/hooks/useCsvExport";
import { useList } from "@/hooks/useList";
import { listEvents, publishEvent, unpublishEvent } from "@/lib/api/events";
import { apiErrorMessage, toApiError, type ApiError } from "@/lib/api/errors";
import { formatDate, formatDateTime, formatInr, paiseToRupeeInput } from "@/lib/format";
import { asBool, asEnum, asText } from "@/lib/params";
import { refreshDashboard } from "@/lib/refresh";
import { EVENT_TYPES, type AdminEvent } from "@/types";

import EventFormModal from "./EventFormModal";
import EventRowActions from "./EventRowActions";

interface EventsListProps {
  createOpen?: boolean;
  onCreateClose?: () => void;
}

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
  paiseToRupeeInput(event.price),
  event.capacity ?? "",
  event.venue?.name ?? "",
  event.committee ?? "",
  event.isTeamEvent ? "Yes" : "No",
  event.teamSize ?? "",
];


export default function EventsList({
  createOpen = false,
  onCreateClose,
}: EventsListProps) {
  const searchParams = useSearchParams();

  const events = useList<AdminEvent>(({ page, pageSize, filters }) =>
    listEvents({
      page,
      pageSize,
      search: asText(filters.search),
      type: asEnum(filters.type, EVENT_TYPES),
      published: asBool(filters.published),
      sort: asText(filters.sort),
      order: asEnum(filters.order, ["asc", "desc"]),
    }),
  );
  const refetchEvents = events.refetch;
  const setEventFilter = events.setFilter;

  const [selected, setSelected] = useState<Set<RowKey>>(new Set());
  const [busy, setBusy] = useState(false);
  const [outcome, setOutcome] = useState<BulkOutcome | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<AdminEvent | null>(null);

  const isNewParam = searchParams.get("new") === "true";
  const eventIdParam = searchParams.get("eventId");
  const targetEventId = eventIdParam ? Number(eventIdParam) : null;
  const modalOpen = formOpen || createOpen || isNewParam || !!targetEventId;

  useEffect(() => {
    const handleOpen = () => {
      setEditingEvent(null);
      setFormOpen(true);
    };
    window.addEventListener("open-create-event", handleOpen);
    return () => window.removeEventListener("open-create-event", handleOpen);
  }, []);

  const closeForm = useCallback(() => {
    setFormOpen(false);
    setEditingEvent(null);
    if (searchParams.get("new") === "true") {
      setEventFilter("new", null);
    }
    if (searchParams.get("eventId")) {
      setEventFilter("eventId", null);
    }
    onCreateClose?.();
  }, [searchParams, onCreateClose, setEventFilter]);

  const handleEdit = useCallback((event: AdminEvent) => {
    setEditingEvent(event);
    setFormOpen(true);
  }, []);

  const handleSaved = useCallback(() => {
    refetchEvents();
    refreshDashboard();
  }, [refetchEvents]);

  const handleMutated = useCallback(() => {
    refetchEvents();
    refreshDashboard();
  }, [refetchEvents]);

  const handleRowError = useCallback((action: string, err: ApiError) => {
    setOutcome({
      action,
      succeeded: 0,
      failures: [{ id: 0, message: apiErrorMessage(err) }],
    });
  }, []);

  const activeQuery = {
    search: asText(events.filters.search),
    type: asEnum(events.filters.type, EVENT_TYPES),
    published: asBool(events.filters.published),
    sort: asText(events.filters.sort),
    order: asEnum(events.filters.order, ["asc", "desc"]),
  };

  // The paging loop, the row cap and the failure handling live in the hook —
  // they were identical to the ones in users and bookings.
  const fetchExportPage = useCallback(
    (page: number, pageSize: number) => listEvents({ ...activeQuery, page, pageSize }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      activeQuery.search,
      activeQuery.type,
      activeQuery.published,
      activeQuery.sort,
      activeQuery.order,
    ],
  );

  const csv = useCsvExport({
    fetchPage: fetchExportPage,
    headers: EXPORT_HEADERS,
    toRow: toExportRow,
    filename: "events",
  });

  const targets = events.items.filter((event) => selected.has(event.id));

  async function runBulk(
    action: string,
    call: (id: number) => Promise<unknown>,
  ) {
    const ids = targets.map((event) => event.id);
    if (ids.length === 0) return;

    setBusy(true);
    setOutcome(null);

    const results = await Promise.allSettled(ids.map((id) => call(id)));

    const failures = results.flatMap((result, index) =>
      result.status === "rejected"
        ? [{ id: ids[index], message: apiErrorMessage(toApiError(result.reason)) }]
        : [],
    );

    setBusy(false);
    setSelected(new Set());
    setOutcome({ action, succeeded: ids.length - failures.length, failures });
    refetchEvents();
    refreshDashboard();
  }

  const columns: Column<AdminEvent>[] = [
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
      sortKey: "heading",
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
      sortKey: "datetime",
      className: "numeric w-48 text-zinc-600",
      cell: (event) => formatDateTime(event.startTime ?? event.datetime),
    },
    {
      key: "price",
      header: "Price",
      align: "right",
      className: "numeric w-28",
      cell: (event) => formatInr(event.price),
    },
    {
      key: "capacity",
      header: "Capacity",
      align: "right",
      className: "numeric w-24 text-zinc-600",
      hideOnMobile: true,
      cell: (event) => event.capacity ?? "—",
    },
    {
      key: "createdAt",
      header: "Created",
      sortKey: "createdAt",
      className: "numeric w-32 text-zinc-500",
      hideOnMobile: true,
      cell: (event) => formatDate(event.createdAt),
    },
    {
      key: "published",
      header: "State",
      className: "w-28",
      cell: (event) => <PublishedBadge published={event.published} />,
    },
    {
      key: "actions",
      header: "",
      className: "w-12",
      // isActions, not hideOnMobile: hiding it the way an ordinary column is
      // hidden left no way to act on a row from a phone at all.
      isActions: true,
      cell: (event) => (
        <EventRowActions
          event={event}
          onEdit={handleEdit}
          onMutated={handleMutated}
          onError={handleRowError}
        />
      ),
    },
  ];

  return (
    <div className="space-y-3">
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

        <div className="flex gap-2 sm:ml-auto">
          <Button
            size="sm"
            loading={csv.exporting}
            disabled={events.total === 0}
            onClick={csv.exportCsv}
          >
            Export CSV
          </Button>
          <Button
            size="sm"
            variant="primary"
            onClick={() => {
              setEditingEvent(null);
              setFormOpen(true);
            }}
          >
            + New Event
          </Button>
        </div>
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
        columns={columns}
        rows={events.items}
        rowKey={(event) => event.id}
        loading={events.loading}
        error={events.error}
        onRetry={events.refetch}
        sort={events.sort}
        order={events.order}
        onToggleSort={events.toggleSort}
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

      <EventFormModal
        open={modalOpen}
        onClose={closeForm}
        event={editingEvent}
        eventId={editingEvent ? null : targetEventId}
        onSaved={handleSaved}
      />
    </div>
  );
}
