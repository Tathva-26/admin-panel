"use client";

import { useState } from "react";

import DataTable, { type Column } from "@/components/common/DataTable";
import SearchInput from "@/components/common/SearchInput";
import { BookingStatusBadge } from "@/components/common/StatusBadge";
import Button from "@/components/ui/Button";
import { Select } from "@/components/ui/Input";
import Pagination from "@/components/ui/Pagination";
import { useList } from "@/hooks/useList";
import { listBookings } from "@/lib/api/bookings";
import { formatDateTime, formatInr } from "@/lib/format";
import { asEnum, asNumber, asText } from "@/lib/params";
import {
  BOOKING_KINDS,
  BOOKING_STATUSES,
  type Booking,
} from "@/types";

import BookingStatusModal from "./BookingStatusModal";

export default function BookingsList() {
  const bookings = useList<Booking>(({ page, pageSize, filters }) =>
    listBookings({
      page,
      pageSize,
      search: asText(filters.search),
      status: asEnum(filters.status, BOOKING_STATUSES),
      kind: asEnum(filters.kind, BOOKING_KINDS),
      // Not exposed as an input — it comes from linking in from an event.
      eventId: asNumber(filters.eventId),
      sort: asText(filters.sort),
      order: filters.order === "desc" ? "desc" : undefined,
    }),
  );

  const [editing, setEditing] = useState<Booking | null>(null);
  const eventFilter = asNumber(bookings.filters.eventId);

  const columns: Column<Booking>[] = [
    {
      key: "bookingUid",
      header: "Booking",
      primary: true,
      className: "numeric",
      cell: (booking) => (
        <span className="font-medium text-zinc-900">{booking.bookingUid}</span>
      ),
    },
    {
      key: "user",
      header: "User",
      cell: (booking) => (
        <div className="min-w-0">
          <p className="truncate text-zinc-900">{booking.user.name}</p>
          <p className="truncate text-xs text-zinc-500">{booking.user.email}</p>
        </div>
      ),
    },
    {
      key: "event",
      header: "Event",
      className: "text-zinc-600",
      cell: (booking) => booking.event?.heading ?? "—",
    },
    {
      key: "kind",
      header: "Kind",
      className: "w-32 text-zinc-600",
      hideOnMobile: true,
      cell: (booking) => booking.kind,
    },
    {
      key: "qty",
      header: "Qty",
      className: "numeric w-16 text-right text-zinc-600",
      hideOnMobile: true,
      cell: (booking) => booking.qty,
    },
    {
      key: "amountTotal",
      sortKey: "amountTotal",
      header: "Total",
      className: "numeric w-28 text-right",
      cell: (booking) => formatInr(booking.amountTotal),
    },
    {
      key: "status",
      header: "Status",
      className: "w-28",
      cell: (booking) => <BookingStatusBadge status={booking.status} />,
    },
    {
      key: "createdAt",
      sortKey: "createdAt",
      header: "Booked",
      className: "numeric w-48 text-zinc-500",
      hideOnMobile: true,
      cell: (booking) => formatDateTime(booking.createdAt),
    },
    {
      key: "actions",
      header: "",
      className: "w-28",
      isActions: true,
      cell: (booking) => (
        <div className="flex justify-end">
          <Button size="sm" variant="ghost" onClick={() => setEditing(booking)}>
            Status
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <SearchInput
          value={bookings.filters.search ?? ""}
          onChange={(value) => bookings.setFilter("search", value)}
          placeholder="Search booking or user…"
        />

        <div className="flex gap-2">
          <Select
            aria-label="Filter by status"
            className="h-9 w-full sm:h-8 sm:w-36"
            value={bookings.filters.status ?? ""}
            onChange={(e) => bookings.setFilter("status", e.target.value)}
          >
            <option value="">All statuses</option>
            {BOOKING_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </Select>

          <Select
            aria-label="Filter by kind"
            className="h-9 w-full sm:h-8 sm:w-44"
            value={bookings.filters.kind ?? ""}
            onChange={(e) => bookings.setFilter("kind", e.target.value)}
          >
            <option value="">All kinds</option>
            {BOOKING_KINDS.map((kind) => (
              <option key={kind} value={kind}>
                {kind}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {/* Only appears when arrived at via a link; clearing it is the way out. */}
      {eventFilter !== undefined ? (
        <div className="flex items-center gap-2 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs text-zinc-600">
          <span className="numeric">Filtered to event #{eventFilter}</span>
          <Button
            size="sm"
            variant="ghost"
            className="ml-auto"
            onClick={() => bookings.setFilter("eventId", null)}
          >
            Clear
          </Button>
        </div>
      ) : null}

      <DataTable
        columns={columns}
        rows={bookings.items}
        rowKey={(booking) => booking.bookingUid}
        loading={bookings.loading}
        error={bookings.error}
        onRetry={bookings.refetch}
        sort={bookings.sort}
        order={bookings.order}
        onToggleSort={bookings.toggleSort}
        emptyTitle="No bookings match"
        emptyDescription="Try clearing the filters."
        footer={
          <Pagination
            page={bookings.page}
            pageSize={bookings.pageSize}
            total={bookings.total}
            totalPages={bookings.totalPages}
            onPageChange={bookings.setPage}
          />
        }
      />

      {editing ? (
        <BookingStatusModal
          key={editing.bookingUid}
          booking={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            bookings.refetch();
          }}
        />
      ) : null}
    </div>
  );
}
