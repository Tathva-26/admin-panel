"use client";

import { useState } from "react";

import ConfirmDialog from "@/components/common/ConfirmDialog";
import DataTable, { type Column } from "@/components/common/DataTable";
import SearchInput from "@/components/common/SearchInput";
import Button from "@/components/ui/Button";
import Pagination from "@/components/ui/Pagination";
import { useList } from "@/hooks/useList";
import { useMutation } from "@/hooks/useMutation";
import { deleteVenue, listVenues } from "@/lib/api/venues";
import { googleMapsUrl } from "@/lib/geo";
import { asText } from "@/lib/params";
import type { Venue } from "@/types";

import VenueFormModal from "./VenueFormModal";

export default function VenuesList() {
  const venues = useList<Venue>(({ page, pageSize, filters }) =>
    listVenues({
      page,
      pageSize,
      search: asText(filters.search),
      sort: asText(filters.sort),
      order: filters.order === "desc" ? "desc" : undefined,
    }),
  );

  const [editing, setEditing] = useState<Venue | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Venue | null>(null);

  const remove = useMutation((id: number) => deleteVenue(id));

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (venue: Venue) => {
    setEditing(venue);
    setFormOpen(true);
  };

  async function confirmDelete() {
    if (!pendingDelete) return;

    const done = await remove.run(pendingDelete.id);
    // A failure keeps the dialog open with its message — most often the
    // documented 409 telling us events still point at this venue.
    if (done !== null) {
      setPendingDelete(null);
      venues.refetch();
    }
  }

  const columns: Column<Venue>[] = [
    {
      key: "id",
      header: "ID",
      className: "numeric w-16 text-zinc-400",
      hideOnMobile: true,
      cell: (venue) => venue.id,
    },
    {
      key: "name",
      header: "Venue",
      primary: true,
      sortKey: "name",
      cell: (venue) => (
        <span className="font-medium text-zinc-900">{venue.name}</span>
      ),
    },
    {
      key: "address",
      header: "Location",
      className: "text-zinc-600",
      cell: (venue) => venue.address || "—",
    },
    {
      key: "map",
      header: "Map",
      className: "w-28",
      cell: (venue) =>
        venue.latitude != null && venue.longitude != null ? (
          <a
            href={googleMapsUrl({
              latitude: venue.latitude,
              longitude: venue.longitude,
            })}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 underline-offset-2 hover:underline"
          >
            View
          </a>
        ) : (
          <span className="text-xs text-zinc-400">Not set</span>
        ),
    },
    {
      key: "actions",
      header: "",
      className: "w-32",
      isActions: true,
      cell: (venue) => (
        <div className="flex justify-end gap-1">
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
        <Button size="sm" variant="primary" className="sm:ml-auto" onClick={openCreate}>
          New venue
        </Button>
      </div>

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
      {formOpen ? (
        <VenueFormModal
          key={editing?.id ?? "new"}
          venue={editing}
          onClose={() => setFormOpen(false)}
          onSaved={() => {
            setFormOpen(false);
            venues.refetch();
          }}
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
