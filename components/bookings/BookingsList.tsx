"use client";

import { useMemo, useState } from "react";

import DataTable, { type Column } from "@/components/common/DataTable";
import DistributionBar, { type Segment } from "@/components/common/DistributionBar";
import SearchInput from "@/components/common/SearchInput";
import { BookingStatusBadge } from "@/components/common/StatusBadge";
import Button from "@/components/ui/Button";
import { Select } from "@/components/ui/Input";
import Pagination from "@/components/ui/Pagination";
import { useCsvExport, type CsvCell } from "@/hooks/useCsvExport";
import { listBookings } from "@/lib/api/bookings";
import { useList } from "@/hooks/useList";
import { formatDateTime, formatInr, paiseToRupeeInput } from "@/lib/format";
import { bookingKindLabel, bookingStatusLabel } from "@/lib/labels";
import { asEnum, asNumber, asText } from "@/lib/params";
import {
  BOOKING_KINDS,
  BOOKING_STATUSES,
  ORDERS,
  type Booking,
  type BookingStatus,
} from "@/types";

import BookingStatusModal from "./BookingStatusModal";

/** Same colours the badges use, so the bar and the rows agree. */
const STATUS_TONES: Record<BookingStatus, Segment["tone"]> = {
  CONFIRMED: "green",
  PENDING: "amber",
  FAILED: "red",
  CANCELLED: "neutral",
  TIMEOUT: "neutral",
};

const EXPORT_HEADERS = [
  "Booking",
  "Status",
  "Kind",
  "User",
  "Email",
  "Event",
  "Qty",
  "Subtotal (INR)",
  "Fee (INR)",
  "Tax (INR)",
  "Total (INR)",
  "Currency",
  "Booked",
];

const toExportRow = (booking: Booking): CsvCell[] => [
  booking.bookingUid,
  booking.status,
  booking.kind,
  booking.user.name,
  booking.user.email,
  booking.event?.heading ?? "",
  booking.qty,
  // Rupees as a plain decimal, which is what a spreadsheet can sum.
  paiseToRupeeInput(booking.amountSubtotal),
  paiseToRupeeInput(booking.amountFee),
  paiseToRupeeInput(booking.amountTax),
  paiseToRupeeInput(booking.amountTotal),
  booking.currency,
  formatDateTime(booking.createdAt),
];

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
      order: asEnum(filters.order, ORDERS),
    }),
  );

  const [editing, setEditing] = useState<Booking | null>(null);
  const eventFilter = asNumber(bookings.filters.eventId);

  const activeQuery = {
    search: asText(bookings.filters.search),
    status: asEnum(bookings.filters.status, BOOKING_STATUSES),
    kind: asEnum(bookings.filters.kind, BOOKING_KINDS),
    eventId: asNumber(bookings.filters.eventId),
    sort: asText(bookings.filters.sort),
    order: asEnum(bookings.filters.order, ORDERS),
  };


  const csv = useCsvExport({
    fetchPage: (page, pageSize) =>
      listBookings({ ...activeQuery, page, pageSize }),
    headers: EXPORT_HEADERS,
    toRow: toExportRow,
    filename: "bookings",
  });

  const statusSplit: Segment[] = useMemo(
    () =>
      BOOKING_STATUSES.map((status) => ({
        label: bookingStatusLabel(status),
        value: bookings.items.filter((b) => b.status === status).length,
        tone: STATUS_TONES[status],
      })),
    [bookings.items],
  );

  /**
   * Only confirmed money is counted. Adding pending and failed together would
   * produce a number that looks like revenue and is not.
   */
  const confirmedTotal = useMemo(
    () =>
      bookings.items
        .filter((booking) => booking.status === "CONFIRMED")
        .reduce((sum, booking) => sum + booking.amountTotal, 0),
    [bookings.items],
  );

  const columns: Column<Booking>[] = [
    {
      key: "bookingUid",
      header: "Booking",
      primary: true,
      className: "numeric",
      cell: (booking) => (
        <span className="font-medium text-foreground">{booking.bookingUid}</span>
      ),
    },
    {
      key: "user",
      header: "User",
      cell: (booking) => (
        <div className="min-w-0">
          <p className="truncate text-foreground">{booking.user.name}</p>
          <p className="truncate text-xs text-muted-foreground">{booking.user.email}</p>
        </div>
      ),
    },
    {
      key: "event",
      header: "Event",
      className: "text-muted-foreground",
      cell: (booking) => booking.event?.heading ?? "—",
    },
    {
      key: "kind",
      header: "Kind",
      className: "w-32 text-muted-foreground",
      hideOnMobile: true,
      cell: (booking) => bookingKindLabel(booking.kind),
    },
    {
      key: "qty",
      header: "Qty",
      align: "right",
      className: "numeric w-16 text-muted-foreground",
      hideOnMobile: true,
      cell: (booking) => booking.qty,
    },
    {
      key: "amountTotal",
      sortKey: "amountTotal",
      header: "Total",
      align: "right",
      className: "numeric w-28",
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
      className: "numeric w-48 text-muted-foreground",
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
                {bookingStatusLabel(status)}
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
                {bookingKindLabel(kind)}
              </option>
            ))}
          </Select>
        </div>

        <Button
          size="sm"
          className="sm:ml-auto"
          loading={csv.exporting}
          disabled={bookings.total === 0}
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

      {/* Only appears when arrived at via a link; clearing it is the way out. */}
      {eventFilter !== undefined ? (
        <div className="flex items-center gap-2 rounded-md border border-border bg-muted px-3 py-1.5 text-xs text-muted-foreground">
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

      {bookings.items.length > 0 ? (
        <DistributionBar
          segments={statusSplit}
          trailing={
            <span className="numeric text-xs text-muted-foreground">
              {formatInr(confirmedTotal)} confirmed &middot; this page
            </span>
          }
        />
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
