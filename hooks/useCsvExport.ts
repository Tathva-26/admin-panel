"use client";

import { useCallback, useState } from "react";

import { toApiError, type ApiError } from "@/lib/api/errors";
import { downloadCsv, timestampedFilename, toCsv } from "@/lib/csv";
import type { ListResponse } from "@/types";

/** Paged through rather than asked for in one go. */
const PAGE_SIZE = 100;

/**
 * Capped so a wrong `total` from the backend cannot spin forever. Well past
 * anything a fest produces, and the UI says when it has been hit.
 */
const MAX_ROWS = 2000;

export type CsvCell = string | number | null | undefined;

interface UseCsvExportOptions<T> {
  /** Usually the same list call the table uses, with the current filters applied. */
  fetchPage: (page: number, pageSize: number) => Promise<ListResponse<T>>;
  headers: string[];
  toRow: (item: T) => CsvCell[];
  /** Becomes `<prefix>-2026-09-08.csv`. */
  filename: string;
}

export interface UseCsvExportResult {
  exportCsv: () => Promise<void>;
  exporting: boolean;
  error: ApiError | null;
  /** True when the cap stopped the export short of `total`. */
  truncated: boolean;
}

/**
 * Exports everything matching the current filters, not just the page on screen
 * — which is the whole point, since the row you want is rarely on page one.
 *
 * Shared rather than repeated per section: the paging loop, the safety cap and
 * the failure handling are identical everywhere, and only the columns differ.
 */
export function useCsvExport<T>({
  fetchPage,
  headers,
  toRow,
  filename,
}: UseCsvExportOptions<T>): UseCsvExportResult {
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [truncated, setTruncated] = useState(false);

  const exportCsv = useCallback(async () => {
    setExporting(true);
    setError(null);
    setTruncated(false);

    try {
      const rows: T[] = [];
      let page = 1;
      let total = Number.POSITIVE_INFINITY;

      while (rows.length < Math.min(total, MAX_ROWS)) {
        const result = await fetchPage(page, PAGE_SIZE);
        total = result.total;

        // A page that comes back empty means we are past the end, whatever
        // `total` claimed — stop rather than loop.
        if (result.items.length === 0) break;

        rows.push(...result.items);
        page += 1;
      }

      setTruncated(rows.length >= MAX_ROWS && total > MAX_ROWS);
      downloadCsv(timestampedFilename(filename), toCsv(headers, rows.map(toRow)));
    } catch (err) {
      setError(toApiError(err));
    } finally {
      setExporting(false);
    }
  }, [fetchPage, headers, toRow, filename]);

  return { exportCsv, exporting, error, truncated };
}
