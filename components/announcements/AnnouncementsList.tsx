"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

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
import { toApiError, type ApiError } from "@/lib/api/errors";
import { formatDate } from "@/lib/format";
import { asBool } from "@/lib/params";
import type { Announcement } from "@/types";

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
      published: asBool(filters.published),
    }),
  );

  const [selected, setSelected] = useState<Set<RowKey>>(new Set());
  const [busy, setBusy] = useState(false);
  const [outcome, setOutcome] = useState<BulkOutcome | null>(null);

  const searchParams = useSearchParams();
  const [formOpen, setFormOpen] = useState(false);
  const [editingAnnouncementId, setEditingAnnouncementId] =
    useState<number | null>(null);

  const isNewParam = searchParams.get("new") === "true";
  const modalOpen = formOpen || isNewParam;

  useEffect(() => {
    const handleOpen = () => {
      setEditingAnnouncementId(null);
      setFormOpen(true);
    };
    window.addEventListener("open-create-announcement", handleOpen);
    return () => window.removeEventListener("open-create-announcement", handleOpen);
  }, []);

  const closeForm = useCallback(() => {
    setFormOpen(false);
    setEditingAnnouncementId(null);
    if (searchParams.get("new") === "true") {
      announcements.setFilter("new", null);
    }
  }, [announcements, searchParams]);

  const handleEdit = useCallback((announcement: Announcement) => {
    setEditingAnnouncementId(announcement.id);
    setFormOpen(true);
  }, []);

  const handleSaved = useCallback(() => {
    announcements.refetch();
  }, [announcements]);

  const handleMutated = useCallback(() => {
    announcements.refetch();
  }, [announcements]);

  const handleRowError = useCallback((action: string, err: ApiError) => {
    setOutcome({
      action,
      succeeded: 0,
      failures: [{ id: 0, message: err.message }],
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
        ? [{ id: ids[index], message: toApiError(result.reason).message }]
        : [],
    );

    setBusy(false);
    setSelected(new Set());
    setOutcome({ action, succeeded: ids.length - failures.length, failures });
    announcements.refetch();
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
      header: "Created",
      className: "w-32 text-zinc-600",
      hideOnMobile: true,
      cell: (a) => formatDate(a.createdAt),
    },
    {
      key: "updatedAt",
      header: "Updated",
      className: "w-32 text-zinc-600",
      hideOnMobile: true,
      cell: (a) => formatDate(a.updatedAt),
    },
    {
      key: "actions",
      header: "",
      className: "w-12",
      hideOnMobile: true,
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

        <div className="flex gap-2 sm:ml-auto">
          <Button
            size="sm"
            variant="primary"
            onClick={() => {
              setEditingAnnouncementId(null);
              setFormOpen(true);
            }}
          >
            + New Announcement
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
        rows={announcements.items}
        rowKey={(a) => a.id}
        loading={announcements.loading}
        error={announcements.error}
        onRetry={announcements.refetch}
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
