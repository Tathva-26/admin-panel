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
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string | number;
  loading?: boolean;
  error?: ApiError | null;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  /** Usually <Pagination />. */
  footer?: ReactNode;
}

const SKELETON_ROWS = 5;

/**
 * One table for every list screen, so loading, empty and error states are
 * consistent and nobody has to rebuild them per section.
 *
 * Order matters: an error replaces the table entirely, but a reload with rows
 * already on screen keeps them visible rather than flashing back to skeletons.
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
}: DataTableProps<T>) {
  const showSkeleton = loading && rows.length === 0;
  const showEmpty = !loading && !error && rows.length === 0;

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
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50/80">
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
              // A refetch over existing rows dims them instead of removing them,
              // so the table does not jump while a filter is applied.
              className={cn(
                "divide-y divide-zinc-100 transition-opacity",
                loading && rows.length > 0 && "opacity-60",
              )}
            >
              {showSkeleton
                ? Array.from({ length: SKELETON_ROWS }, (_, rowIndex) => (
                    <tr key={`skeleton-${rowIndex}`}>
                      {columns.map((column) => (
                        <td key={column.key} className="px-4 py-2.5">
                          <span className="block h-4 w-full max-w-40 animate-pulse rounded bg-zinc-100" />
                        </td>
                      ))}
                    </tr>
                  ))
                : rows.map((row) => (
                    <tr key={rowKey(row)} className="hover:bg-zinc-50/60">
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
      )}

      {footer && !error && !showEmpty ? footer : null}
    </div>
  );
}
