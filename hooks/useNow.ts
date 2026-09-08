"use client";

import { useCallback, useSyncExternalStore } from "react";

/** A minute is the finest granularity anything on screen actually shows. */
const DEFAULT_INTERVAL_MS = 60_000;

/**
 * A clock that re-renders on a tick, so "what is on right now" stays true
 * without anyone reloading.
 *
 * useSyncExternalStore rather than setState-in-an-effect: the wall clock is
 * genuinely an external mutable source, and this is the API meant for reading
 * one. It also gives a stable server snapshot for free, so SSR and the first
 * client render agree instead of hydrating a mismatch.
 *
 * The snapshot is the interval bucket rather than the raw timestamp, because
 * getSnapshot must return the same value until the store actually changes —
 * returning Date.now() would re-render forever.
 */
export function useNow(intervalMs: number = DEFAULT_INTERVAL_MS): Date {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const id = setInterval(onStoreChange, intervalMs);
      return () => clearInterval(id);
    },
    [intervalMs],
  );

  const getSnapshot = useCallback(
    () => Math.floor(Date.now() / intervalMs),
    [intervalMs],
  );

  // 0 on the server: there is no meaningful "now" to prerender, and anything
  // else would be stale by the time it reached the browser.
  const bucket = useSyncExternalStore(subscribe, getSnapshot, () => 0);

  return new Date(bucket * intervalMs);
}
