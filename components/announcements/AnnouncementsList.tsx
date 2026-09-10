"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";

import DataTable, { type Column, type RowKey } from "@/components/common/DataTable";
import { PublishedBadge } from "@/components/common/StatusBadge";
import Button from "@/components/ui/Button";
import { Select } from "@/components/ui/Input";
import Pagination from "@/components/ui/Pagination";
import { useList } from "@/hooks/useList";
import {
  listAnnouncements,
  publishAnnouncement,
  unpublishAnnouncement,
} from "@/lib/api/announcements";
import { apiErrorMessage, toApiError, type ApiError } from "@/lib/api/errors";
import { formatDate } from "@/lib/format";
import { asBool, asEnum, asText } from "@/lib/params";
import { refreshDashboard } from "@/lib/refresh";
import { ORDERS, type Announcement } from "@/types";

import AnnouncementFormModal from "./AnnouncementFormModal";
import AnnouncementRowActions from "./AnnouncementRowActions";

import BulkActionBar from "@/components/common/BulkActionBar";

interface BulkOutcome {
  action: string;
  succeeded: number;
  failures: { id: number; message: string }[];
}

export default function AnnouncementsList() {
  const announcements = useList<Announcement>(({ page, pageSize, filters }) =>
    listAnnouncements({
      page,
      pageSize,
      search: asText(filters.search),
      published: asBool(filters.published),
      sort: asText(filters.sort),
      order: asEnum(filters.order, ORDERS),
    }),
  );
  const refetchAnnouncements = announcements.refetch;
  const setAnnouncementFilter = announcements.setFilter;

  const [selected, setSelected] = useState<Set<RowKey>>(new Set());
  const [busy, setBusy] = useState(false);
  const [outcome, setOutcome] = useState<BulkOutcome | null>(null);

  const searchParams = useSearchParams();
  const [formOpen, setFormOpen] = useState(false);
  const [editingAnnouncementId, setEditingAnnouncementId] =
    useState<number | null>(null);

  const isNewParam = searchParams.get("new") === "true";
  const modalOpen = formOpen || isNewParam;

  const closeForm = useCallback(() => {
    setFormOpen(false);
    setEditingAnnouncementId(null);
    if (searchParams.get("new") === "true") {
      setAnnouncementFilter("new", null);
    }
  }, [searchParams, setAnnouncementFilter]);

  const handleEdit = useCallback((announcement: Announcement) => {
    setEditingAnnouncementId(announcement.id);
    setFormOpen(true);
  }, []);

  const handleSaved = useCallback(() => {
    refetchAnnouncements();
    refreshDashboard();
  }, [refetchAnnouncements]);

  const handleMutated = useCallback(() => {
    refetchAnnouncements();
    refreshDashboard();
  }, [refetchAnnouncements]);

  const handleRowError = useCallback((action: string, err: ApiError) => {
    setOutcome({
      action,
      succeeded: 0,
      failures: [{ id: 0, message: apiErrorMessage(err) }],
    });
  }, []);

  const targets = announcements.items.filter((a) => selected.has(a.id));

  async function runBulk(
    action: string,
    call: (id: number) => Promise<unknown>,
  ) {
    const ids = targets.map((a) => a.id);
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
    refetchAnnouncements();
    refreshDashboard();
  }

  const columns: Column<Announcement>[] = [
    {
      key: "id",
      header: "ID",
      className: "numeric w-16 text-zinc-400",
      hideOnMobile: true,
      cell: (a) => a.id,
    },
    {
      key: "title",
      sortKey: "title",
      header: "Title",
      primary: true,
      cell: (a) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-zinc-900">{a.title}</p>
          <p className="truncate text-xs text-zinc-500 line-clamp-1">
            {a.content}
          </p>
        </div>
      ),
    },
    {
      key: "published",
      header: "State",
      className: "w-28",
      cell: (a) => <PublishedBadge published={a.published} />,
    },
    {
      key: "createdAt",
      sortKey: "createdAt",
      header: "Created",
      className: "w-32 text-zinc-600",
      hideOnMobile: true,
      cell: (a) => formatDate(a.createdAt),
    },
    {
      key: "updatedAt",
      // Not sortable: the backend's sort enum is ['createdAt', 'title'], and
      // asking for updatedAt comes back 422.
      header: "Updated",
      className: "w-32 text-zinc-600",
      hideOnMobile: true,
      cell: (a) => formatDate(a.updatedAt),
    },
    {
      key: "actions",
      header: "",
      className: "w-12",
      // isActions, not hideOnMobile: hiding it the way an ordinary column is
      // hidden left no way to act on a row from a phone at all.
      isActions: true,
      cell: (a) => (
        <AnnouncementRowActions
          announcement={a}
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
        <div className="flex gap-2">
          <Select
            aria-label="Filter by state"
            className="h-9 w-full sm:h-8 sm:w-36"
            value={announcements.filters.published ?? ""}
            onChange={(e) =>
              announcements.setFilter("published", e.target.value)
            }
          >
            <option value="">All states</option>
            <option value="true">Published</option>
            <option value="false">Draft</option>
          </Select>
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
        rows={announcements.items}
        rowKey={(a) => a.id}
        loading={announcements.loading}
        error={announcements.error}
        onRetry={announcements.refetch}
        sort={announcements.sort}
        order={announcements.order}
        onToggleSort={announcements.toggleSort}
        selectable
        selected={selected}
        onSelectedChange={setSelected}
        emptyTitle="No announcements match"
        emptyDescription="Try clearing the filters, or create the first announcement."
        footer={
          <Pagination
            page={announcements.page}
            pageSize={announcements.pageSize}
            total={announcements.total}
            totalPages={announcements.totalPages}
            onPageChange={announcements.setPage}
          />
        }
      />

      <BulkActionBar
        count={targets.length}
        onClear={() => setSelected(new Set())}
      >
        <Button
          size="sm"
          variant="primary"
          loading={busy}
          onClick={() => runBulk("Publish", publishAnnouncement)}
        >
          Publish
        </Button>
        <Button
          size="sm"
          loading={busy}
          onClick={() => runBulk("Unpublish", unpublishAnnouncement)}
        >
          Unpublish
        </Button>
      </BulkActionBar>

      <AnnouncementFormModal
        open={modalOpen}
        onClose={closeForm}
        announcementId={editingAnnouncementId}
        onSaved={handleSaved}
      />
    </div>
  );
}
