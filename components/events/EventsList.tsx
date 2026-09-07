"use client";

import DataTable, { type Column } from "@/components/common/DataTable";
import SearchInput from "@/components/common/SearchInput";
import { PublishedBadge } from "@/components/common/StatusBadge";
import { Select } from "@/components/ui/Input";
import Pagination from "@/components/ui/Pagination";
import { useList } from "@/hooks/useList";
import { listEvents } from "@/lib/api/events";
import { formatDateTime, formatInr } from "@/lib/format";
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
      </div>

      <DataTable
        columns={COLUMNS}
        rows={events.items}
        rowKey={(event) => event.id}
        loading={events.loading}
        error={events.error}
        onRetry={events.refetch}
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
    </div>
  );
}
