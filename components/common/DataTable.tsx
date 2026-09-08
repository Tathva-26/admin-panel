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
  /** Applied to both the header and every cell — widths, colours. */
  className?: string;
  /**
   * Column alignment. Set here rather than as a `text-*` class in `className`:
   * `cn` only joins strings, so a `text-center` competing with the header's
   * default `text-left` is resolved by stylesheet order rather than intent.
   */
  align?: "left" | "center" | "right";
  /**
   * On mobile this column is the card's heading rather than a labelled row.
   * Mark exactly one column per table.
   */
  primary?: boolean;
  /** Left out of the mobile card, to keep it to what matters on a phone. */
  hideOnMobile?: boolean;
  /**
   * Makes the header a sort control. The value is the `sort` param the backend
   * expects, which is not always the column key.
   */
  sortKey?: string;
  /** Kept in the mobile card's action row rather than the label/value grid. */
  isActions?: boolean;
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
  /**
   * Width at which the card layout gives way to the table. A wide, dense table
   * needs more room before it stops being cramped, so those sections pass
   * "lg". Written as whole class names because Tailwind cannot see a class
   * assembled at runtime.
   */
  cardsBelow?: "md" | "lg";
  /** Wire these to useList to make `sortKey` columns clickable. */
  sort?: string;
  order?: "asc" | "desc";
  onToggleSort?: (key: string) => void;
}

const SKELETON_ROWS = 5;

const ALIGN = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
} as const;

const CARDS_VISIBLE = { md: "md:hidden", lg: "lg:hidden" } as const;
const TABLE_VISIBLE = {
  md: "hidden md:block",
  lg: "hidden lg:block",
} as const;

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
  cardsBelow = "md",
  sort,
  order = "asc",
  onToggleSort,
}: DataTableProps<T>) {
  const showSkeleton = loading && rows.length === 0;
  const showEmpty = !loading && !error && rows.length === 0;

  const primary = columns.find((column) => column.primary) ?? columns[0];
  const actionColumn = columns.find((column) => column.isActions);
  const secondary = columns.filter(
    (column) =>
      column !== primary && column !== actionColumn && !column.hideOnMobile,
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
          <ul
            className={cn(
              "divide-y divide-zinc-100",
              CARDS_VISIBLE[cardsBelow],
              dimWhileReloading,
            )}
          >
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

                      {/*
                        Actions belong on a phone too — hiding them the way an
                        ordinary column is hidden would leave no way to edit or
                        delete a row from a small screen.
                      */}
                      {actionColumn ? (
                        <div className="mt-2 flex justify-end border-t border-zinc-100 pt-2">
                          {actionColumn.cell(row)}
                        </div>
                      ) : null}
                    </div>
                  </li>
                ))}
          </ul>

          {/*
            Bounded and scrollable in both axes, which is what makes the sticky
            header work: `overflow-x-auto` alone forces `overflow-y` to auto,
            so this div — not <main> — is already the scroll container the
            header sticks to. Without a height it never scrolls, and the header
            never sticks. The pagination footer sits outside, so it stays put.
          */}
          <div
            className={cn(
              "max-h-[min(38rem,calc(100dvh-20rem))] overflow-auto",
              TABLE_VISIBLE[cardsBelow],
            )}
          >
            <table className="w-full border-collapse text-sm">
              {/* Sticky so column labels survive scrolling a long list.
                  The background is on the cells rather than the row: a <tr>
                  cannot paint behind sticky <th>s, so rows would show through. */}
              <thead className="sticky top-0 z-10">
                <tr className="border-b border-zinc-200">
                  {selectionOn ? (
                    <th
                      scope="col"
                      className="border-b border-zinc-200 bg-zinc-50 w-10 px-4 py-2"
                    >
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

                  {columns.map((column) => {
                    const sortable = column.sortKey && onToggleSort;
                    const active = sortable && sort === column.sortKey;

                    return (
                      <th
                        key={column.key}
                        scope="col"
                        aria-sort={
                          active
                            ? order === "asc"
                              ? "ascending"
                              : "descending"
                            : undefined
                        }
                        className={cn(
                          "border-b border-zinc-200 bg-zinc-50 px-4 py-2 text-xs font-medium tracking-wide text-zinc-500 uppercase",
                          ALIGN[column.align ?? "left"],
                          column.className,
                        )}
                      >
                        {sortable ? (
                          <button
                            type="button"
                            onClick={() => onToggleSort(column.sortKey!)}
                            className={cn(
                              "-mx-1 inline-flex items-center gap-1 rounded px-1 py-0.5 uppercase hover:bg-zinc-200/60",
                              active ? "text-zinc-900" : "text-zinc-500",
                            )}
                          >
                            {column.header}
                            <span
                              aria-hidden="true"
                              className={cn(
                                "text-[10px] leading-none",
                                active ? "opacity-100" : "opacity-0",
                              )}
                            >
                              {order === "asc" ? "▲" : "▼"}
                            </span>
                          </button>
                        ) : (
                          column.header
                        )}
                      </th>
                    );
                  })}
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
                              ALIGN[column.align ?? "left"],
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
