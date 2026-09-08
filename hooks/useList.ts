"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";

import type { ApiError } from "@/lib/api/errors";
import type { ListResponse } from "@/types";

import { useApi } from "./useApi";

export const DEFAULT_PAGE_SIZE = 20;

/** What the fetcher is handed on every load. */
export interface ListParams {
  page: number;
  pageSize: number;
  /** Every other query param, as raw strings. Parse with lib/params helpers. */
  filters: Record<string, string>;
}

export interface UseListResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  loading: boolean;
  error: ApiError | null;
  /** Current filter values, for binding inputs. */
  filters: Record<string, string>;
  /** Sets or clears one filter and returns to page 1. */
  setFilter: (key: string, value: string | null) => void;
  setPage: (page: number) => void;
  refetch: () => void;
}

/**
 * List state â€” pagination and filters â€” kept in the URL rather than component
 * state, so a filtered view survives a reload, can be pasted to someone else,
 * and the back button steps through it.
 *
 * The fetcher must depend only on its `params` argument; it is re-run when the
 * query string changes, not when the component re-renders.
 *
 *   const events = useList<AdminEvent>(({ page, pageSize, filters }) =>
 *     listEvents({
 *       page,
 *       pageSize,
 *       search: asText(filters.search),
 *       type: asEnum(filters.type, EVENT_TYPES),
 *     }),
 *   );
 *
 * The fetcher may only read its `params` argument â€” it is re-run when the query
 * string changes, not on every render.
 *
 * Uses useSearchParams, so the component calling it must sit inside a
 * <Suspense> boundary.
 */
export function useList<T>(
  fetcher: (params: ListParams) => Promise<ListResponse<T>>,
  options?: { pageSize?: number },
): UseListResult<T> {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const pageSize = options?.pageSize ?? DEFAULT_PAGE_SIZE;
  const queryString = searchParams.toString();

  const { page, filters } = useMemo(() => {
    const all = Object.fromEntries(new URLSearchParams(queryString));
    const { page: rawPage, ...rest } = all;
    const parsed = Number(rawPage);

    return {
      page: Number.isInteger(parsed) && parsed > 0 ? parsed : 1,
      filters: rest,
    };
  }, [queryString]);

  const { data, error, loading, refetch } = useApi<ListResponse<T>>(
    `${pathname}?${queryString}&pageSize=${pageSize}`,
    () => fetcher({ page, pageSize, filters }),
  );

  const replaceQuery = useCallback(
    (next: URLSearchParams) => {
      const query = next.toString();

      // Native history rather than router.push. Only the query string changes
      // and the page's server component does not depend on it, so a router
      // navigation would round-trip to the server for a result identical to
      // what is already on screen. Next syncs pushState with useSearchParams,
      // so this hook still re-runs and the back button still works.
      window.history.pushState(
        null,
        "",
        query ? `${pathname}?${query}` : pathname,
      );
    },
    [pathname],
  );

  const setFilter = useCallback(
    (key: string, value: string | null) => {
      const next = new URLSearchParams(queryString);

      if (value === null || value === "") next.delete(key);
      else next.set(key, value);

      // A narrower filter almost never has as many pages, and staying on page 4
      // of a 1-page result is the classic way to land on an empty screen.
      next.delete("page");

      replaceQuery(next);
    },
    [queryString, replaceQuery],
  );

  const setPage = useCallback(
    (nextPage: number) => {
      const next = new URLSearchParams(queryString);

      if (nextPage <= 1) next.delete("page");
      else next.set("page", String(nextPage));

      replaceQuery(next);
    },
    [queryString, replaceQuery],
  );

  const total = data?.total ?? 0;

  return {
    items: data?.items ?? [],
    page: data?.page ?? page,
    pageSize: data?.pageSize ?? pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    loading,
    error,
    filters,
    setFilter,
    setPage,
    refetch,
  };
}
