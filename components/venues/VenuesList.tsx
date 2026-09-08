"use client";

import { useCallback, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import ConfirmDialog from "@/components/common/ConfirmDialog";
import DataTable, { type Column } from "@/components/common/DataTable";
import SearchInput from "@/components/common/SearchInput";
import Button from "@/components/ui/Button";
import Pagination from "@/components/ui/Pagination";
import { useApi } from "@/hooks/useApi";
import { useList } from "@/hooks/useList";
import { useMutation } from "@/hooks/useMutation";
import { useNow } from "@/hooks/useNow";
import { listEvents } from "@/lib/api/events";
import { deleteVenue, listVenues } from "@/lib/api/venues";
import { asEnum, asText } from "@/lib/params";
import { groupByVenue } from "@/lib/schedule";
import { ORDERS, type AdminEvent, Venue } from "@/types";

import VenueActivityCell from "./VenueActivityCell";
import VenueFormModal from "./VenueFormModal";
import VenueScheduleModal from "./VenueScheduleModal";

/**
 * Events are fetched once for the whole table rather than per row. A venue list
 * is short, and one request beats N.
 *
 * One page only. A fest does not run more events than this, but if it ever
 * does the counts below would quietly be wrong — so the limit is surfaced
 * rather than assumed.
 */
const SCHEDULE_PAGE_SIZE = 100;

export default function VenuesList() {
  const venues = useList<Venue>(({ page, pageSize, filters }) =>
    listVenues({
      page,
      pageSize,
      search: asText(filters.search),
      sort: asText(filters.sort),
      order: asEnum(filters.order, ORDERS),
    }),
  );

  const setVenueFilter = venues.setFilter;

  const schedule = useApi("venue-schedule", () =>
    listEvents({ pageSize: SCHEDULE_PAGE_SIZE }),
  );

  const now = useNow();

  const eventsByVenue = useMemo(
    () => groupByVenue(schedule.data?.items ?? []),
    [schedule.data],
  );

  const searchParams = useSearchParams();
  const [editing, setEditing] = useState<Venue | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const isNewParam = searchParams.get("new") === "true";
  const [pendingDelete, setPendingDelete] = useState<Venue | null>(null);
  const [viewingSchedule, setViewingSchedule] = useState<Venue | null>(null);

  const remove = useMutation((id: number) => deleteVenue(id));

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const closeForm = useCallback(() => {
    setFormOpen(false);
    if (searchParams.get("new") === "true") setVenueFilter("new", null);
  }, [searchParams, setVenueFilter]);

  const openEdit = (venue: Venue) => {
    setEditing(venue);
    setFormOpen(true);
  };

  const eventsFor = (venue: Venue): AdminEvent[] =>
    eventsByVenue.get(venue.id) ?? [];

  async function confirmDelete() {
    if (!pendingDelete) return;

    const done = await remove.run(pendingDelete.id);
    // A failure keeps the dialog open with its message — most often the
    // documented 409 telling us events still point at this venue.
    if (done !== null) {
      setPendingDelete(null);
      venues.refetch();
      // The deleted venue's events are now unplaced, so the schedule is stale.
      schedule.refetch();
    }
  }

  const columns: Column<Venue>[] = [
    {
      key: "name",
      header: "Venue",
      primary: true,
      sortKey: "name",
      // Capped rather than left to absorb all the slack, which pushed the
      // live column out to the far right on a wide screen.
      className: "w-72",
      cell: (venue) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-zinc-900">{venue.name}</p>
          {venue.address ? (
            <p className="truncate text-xs text-zinc-500">{venue.address}</p>
          ) : null}
        </div>
      ),
    },
    {
      key: "activity",
      header: "Right now",
      className: "w-64",
      cell: (venue) => (
        <VenueActivityCell
          events={eventsFor(venue)}
          now={now}
          loading={schedule.loading}
        />
      ),
    },
    {
      key: "count",
      header: "Events",
      align: "center",
      className: "numeric w-24 text-zinc-600",
      hideOnMobile: true,
      cell: (venue) => eventsFor(venue).length || "—",
    },
    {
      key: "actions",
      header: "",
      className: "w-44",
      isActions: true,
      cell: (venue) => (
        <div className="flex justify-end gap-1">
          <Button
            size="sm"
            variant="ghost"
            disabled={eventsFor(venue).length === 0}
            onClick={() => setViewingSchedule(venue)}
          >
            Schedule
          </Button>
          <Button size="sm" variant="ghost" onClick={() => openEdit(venue)}>
            Edit
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-red-600 hover:bg-red-50 hover:text-red-700"
            onClick={() => {
              remove.reset();
              setPendingDelete(venue);
            }}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <SearchInput
          value={venues.filters.search ?? ""}
          onChange={(value) => venues.setFilter("search", value)}
          placeholder="Search venues…"
        />
      </div>

      {/* Silently showing counts drawn from a truncated fetch would be worse
          than showing none. */}
      {(schedule.data?.total ?? 0) > SCHEDULE_PAGE_SIZE ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          There are {schedule.data?.total} events but only the first{" "}
          {SCHEDULE_PAGE_SIZE} are counted here, so the schedule below may be
          incomplete.
        </p>
      ) : null}

      {/* The schedule is secondary to the list — if it fails, the venues are
          still usable, so this says so quietly rather than taking over. */}
      {schedule.error ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Couldn&rsquo;t load the event schedule, so &ldquo;Right now&rdquo; is
          unavailable. {schedule.error.message}
        </p>
      ) : null}

      <DataTable
        columns={columns}
        rows={venues.items}
        rowKey={(venue) => venue.id}
        loading={venues.loading}
        error={venues.error}
        onRetry={venues.refetch}
        sort={venues.sort}
        order={venues.order}
        onToggleSort={venues.toggleSort}
        emptyTitle="No venues yet"
        emptyDescription="Add a venue before scheduling events against it."
        emptyAction={
          <Button size="sm" variant="primary" onClick={openCreate}>
            New venue
          </Button>
        }
        footer={
          <Pagination
            page={venues.page}
            pageSize={venues.pageSize}
            total={venues.total}
            totalPages={venues.totalPages}
            onPageChange={venues.setPage}
          />
        }
      />

      {/* Keyed so switching between rows (or create) starts from a fresh draft. */}
      {formOpen || isNewParam ? (
        <VenueFormModal
          key={editing?.id ?? "new"}
          venue={editing}
          onClose={closeForm}
          onSaved={() => {
            closeForm();
            venues.refetch();
            schedule.refetch();
          }}
        />
      ) : null}

      {viewingSchedule ? (
        <VenueScheduleModal
          key={viewingSchedule.id}
          venue={viewingSchedule}
          events={eventsFor(viewingSchedule)}
          now={now}
          onClose={() => setViewingSchedule(null)}
        />
      ) : null}

      <ConfirmDialog
        open={pendingDelete !== null}
        title={`Delete ${pendingDelete?.name ?? "venue"}?`}
        description="Events already scheduled here must be reassigned first — the backend will refuse otherwise."
        confirmLabel="Delete venue"
        destructive
        loading={remove.loading}
        error={remove.error}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
