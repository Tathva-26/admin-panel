"use client";

import type { ReactNode } from "react";

import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import { cn } from "@/lib/cn";
import type { ApiError } from "@/lib/api/errors";

export interface Column<T> {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  /** Applied to both the header and every cell — widths, alignment. */
  className?: string;
  /**
   * On mobile this column is the card's heading rather than a labelled row.
   * Mark exactly one column per table.
   */
  primary?: boolean;
  /** Left out of the mobile card, to keep it to what matters on a phone. */
  hideOnMobile?: boolean;
}

export type RowKey = string | number;

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => RowKey;
  loading?: boolean;
  error?: ApiError | null;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  /** Usually <Pagination />. */
  footer?: ReactNode;
  /** Adds a checkbox column. Pass `selected` and `onSelectedChange` with it. */
  selectable?: boolean;
  selected?: ReadonlySet<RowKey>;
  onSelectedChange?: (next: Set<RowKey>) => void;
}

const SKELETON_ROWS = 5;

const CHECKBOX_CLASS =
  "h-4 w-4 shrink-0 cursor-pointer rounded border-zinc-300 accent-zinc-900";

/**
 * One table for every list screen, so loading, empty and error states are
 * consistent and nobody has to rebuild them per section.
 *
 * Below `md` the same columns render as stacked cards. A seven-column table on
 * a phone is either unreadable or a horizontal scroll nobody discovers, and
 * label/value pairs stay legible at any width.
 */
export default function DataTable<T>({
  columns,
  rows,
  rowKey,
  loading = false,
  error = null,
  onRetry,
  emptyTitle = "Nothing here yet",
  emptyDescription,
  emptyAction,
  footer,
  selectable = false,
  selected,
  onSelectedChange,
}: DataTableProps<T>) {
  const showSkeleton = loading && rows.length === 0;
  const showEmpty = !loading && !error && rows.length === 0;

  const primary = columns.find((column) => column.primary) ?? columns[0];
  const secondary = columns.filter(
    (column) => column !== primary && !column.hideOnMobile,
  );

  const selectionOn = selectable && !!onSelectedChange;
  const isSelected = (row: T) => selected?.has(rowKey(row)) ?? false;
  const selectedOnPage = rows.filter(isSelected).length;
  const allOnPageSelected = rows.length > 0 && selectedOnPage === rows.length;

  const toggleRow = (row: T) => {
    if (!onSelectedChange) return;

    const next = new Set(selected ?? []);
    const key = rowKey(row);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    onSelectedChange(next);
  };

  // Only ever touches keys on this page, so a selection made under one filter
  // is not silently wiped by paging.
  const toggleAllOnPage = () => {
    if (!onSelectedChange) return;

    const next = new Set(selected ?? []);
    for (const row of rows) {
      if (allOnPageSelected) next.delete(rowKey(row));
      else next.add(rowKey(row));
    }
    onSelectedChange(next);
  };

  // A refetch over existing rows dims them instead of removing them, so the
  // list does not jump while a filter is applied.
  const dimWhileReloading = cn(
    "transition-opacity",
    loading && rows.length > 0 && "opacity-60",
  );

  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
      {error ? (
        <ErrorState error={error} onRetry={onRetry} />
      ) : showEmpty ? (
        <EmptyState
          title={emptyTitle}
          description={emptyDescription}
          action={emptyAction}
        />
      ) : (
        <>
          {/* Phones and small tablets: one card per row. */}
          <ul className={cn("divide-y divide-zinc-100 md:hidden", dimWhileReloading)}>
            {showSkeleton
              ? Array.from({ length: SKELETON_ROWS }, (_, index) => (
                  <li key={`skeleton-${index}`} className="space-y-2 px-4 py-3">
                    <span className="block h-4 w-2/3 animate-pulse rounded bg-zinc-100" />
                    <span className="block h-3 w-1/3 animate-pulse rounded bg-zinc-100" />
                  </li>
                ))
              : rows.map((row) => (
                  <li key={rowKey(row)} className="flex gap-3 px-4 py-3">
                    {selectionOn ? (
                      <input
                        type="checkbox"
                        aria-label="Select row"
                        checked={isSelected(row)}
                        onChange={() => toggleRow(row)}
                        className={cn(CHECKBOX_CLASS, "mt-1")}
                      />
                    ) : null}

                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-zinc-900">
                        {primary.cell(row)}
                      </div>

                      <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5">
                        {secondary.map((column) => (
                          <div key={column.key} className="min-w-0">
                            <dt className="text-[11px] tracking-wide text-zinc-400 uppercase">
                              {column.header}
                            </dt>
                            <dd className="truncate text-sm text-zinc-700">
                              {column.cell(row)}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  </li>
                ))}
          </ul>

          {/* md and up: the real table. */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50/80">
                  {selectionOn ? (
                    <th scope="col" className="w-10 px-4 py-2">
                      <input
                        type="checkbox"
                        aria-label="Select all on this page"
                        checked={allOnPageSelected}
                        // Some but not all: show the dash rather than a tick.
                        ref={(node) => {
                          if (node)
                            node.indeterminate =
                              selectedOnPage > 0 && !allOnPageSelected;
                        }}
                        onChange={toggleAllOnPage}
                        className={CHECKBOX_CLASS}
                      />
                    </th>
                  ) : null}

                  {columns.map((column) => (
                    <th
                      key={column.key}
                      scope="col"
                      className={cn(
                        "px-4 py-2 text-left text-xs font-medium tracking-wide text-zinc-500 uppercase",
                        column.className,
                      )}
                    >
                      {column.header}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody
                className={cn("divide-y divide-zinc-100", dimWhileReloading)}
              >
                {showSkeleton
                  ? Array.from({ length: SKELETON_ROWS }, (_, rowIndex) => (
                      <tr key={`skeleton-${rowIndex}`}>
                        {selectionOn ? <td className="px-4 py-2.5" /> : null}
                        {columns.map((column) => (
                          <td key={column.key} className="px-4 py-2.5">
                            <span className="block h-4 w-full max-w-40 animate-pulse rounded bg-zinc-100" />
                          </td>
                        ))}
                      </tr>
                    ))
                  : rows.map((row) => (
                      <tr
                        key={rowKey(row)}
                        className={cn(
                          "hover:bg-zinc-50/60",
                          isSelected(row) && "bg-zinc-50",
                        )}
                      >
                        {selectionOn ? (
                          <td className="px-4 py-2.5">
                            <input
                              type="checkbox"
                              aria-label="Select row"
                              checked={isSelected(row)}
                              onChange={() => toggleRow(row)}
                              className={CHECKBOX_CLASS}
                            />
                          </td>
                        ) : null}

                        {columns.map((column) => (
                          <td
                            key={column.key}
                            className={cn(
                              "px-4 py-2.5 align-middle text-zinc-700",
                              column.className,
                            )}
                          >
                            {column.cell(row)}
                          </td>
                        ))}
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {footer && !error && !showEmpty ? footer : null}
    </div>
  );
}
