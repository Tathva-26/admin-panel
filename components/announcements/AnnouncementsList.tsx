"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";

import DataTable, { type Column, type RowKey } from "@/components/common/DataTable";
import { PublishedBadge } from "@/components/common/StatusBadge";
import Button from "@/components/ui/Button";
import { Select } from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
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

  // Title/content are truncated in the table row; tapping opens this so the
  // full text is still reachable, on mobile as much as desktop.
  const [viewing, setViewing] = useState<Announcement | null>(null);

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
      className: "numeric w-16 text-muted-foreground",
      hideOnMobile: true,
      cell: (a) => a.id,
    },
{
      key: "title",
      sortKey: "title",
      header: "Title",
      primary: true,
      // A reasonable min-width prevents it from getting crushed on small screens
      className: "min-w-[150px]", 
      cell: (a) => (
        <button
          type="button"
          onClick={() => setViewing(a)}
          // inline-flex makes the button wrap tightly around the text instead of filling the gap
          // We apply the max-width constraints directly to the button now.
          className="group inline-flex max-w-[200px] sm:max-w-[300px] md:max-w-[400px] lg:max-w-[600px] text-left outline-none rounded-sm ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <span className="truncate font-medium text-foreground transition-colors group-hover:text-white">
            {a.title}
          </span>
        </button>
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
      className: "w-32 text-muted-foreground",
      hideOnMobile: true,
      cell: (a) => formatDate(a.createdAt),
    },
    {
      key: "updatedAt",
      header: "Updated",
      className: "w-32 text-muted-foreground",
      hideOnMobile: true,
      cell: (a) => formatDate(a.updatedAt),
    },
    {
      key: "actions",
      header: "",
      className: "w-12",
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
              ? "rounded-md border border-warning/40 bg-warning/15 px-3 py-2 text-sm text-warning"
              : "rounded-md border border-success/40 bg-success/15 px-3 py-2 text-sm text-success"
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

      {viewing ? (
        <Modal
          open
          onClose={() => setViewing(null)}
          title={viewing.title}
          footer={
            <Button size="sm" onClick={() => setViewing(null)}>
              Close
            </Button>
          }
        >
          <div className="space-y-2 text-sm">
            <p className="text-xs text-muted-foreground">
              {viewing.published ? "Published" : "Draft"} &middot; Created{" "}
              {formatDate(viewing.createdAt)}
            </p>
            <p className="whitespace-pre-wrap text-foreground">
              {viewing.content}
            </p>
          </div>
        </Modal>
      ) : null}

      <AnnouncementFormModal
        open={modalOpen}
        onClose={closeForm}
        announcementId={editingAnnouncementId}
        onSaved={handleSaved}
      />
    </div>
  );
}