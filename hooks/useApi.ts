"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { toApiError, type ApiError } from "@/lib/api/errors";

export interface UseApiResult<T> {
  data: T | null;
  error: ApiError | null;
  loading: boolean;
  refetch: () => void;
}

interface State<T> {
  /** Which request this result belongs to. */
  key: string;
  data: T | null;
  error: ApiError | null;
}

/**
 * Runs a GET and gives back the loading/error/data triple every screen needs.
 *
 * The request is identified by `key` rather than a dependency array — put
 * everything the fetcher varies on into it:
 *
 *   const events = useApi(`events?${queryString}`, () => listEvents(query));
 *
 * Loading is derived by comparing the key of the result we hold against the key
 * we want, so nothing sets state synchronously inside an effect. Stale
 * responses are discarded, so typing quickly in a search box cannot leave an
 * earlier, slower response on screen.
 */
export function useApi<T>(
  key: string,
  fetcher: () => Promise<T>,
): UseApiResult<T> {
  const [reloadCount, setReloadCount] = useState(0);
  const requestKey = `${key}#${reloadCount}`;

  const [state, setState] = useState<State<T>>({
    key: "",
    data: null,
    error: null,
  });

  // The fetcher is a new closure each render and must not be a dependency, but
  // the effect still needs the current one rather than the first.
  const fetcherRef = useRef(fetcher);
  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  useEffect(() => {
    let active = true;

    fetcherRef.current().then(
      (data) => {
        if (active) setState({ key: requestKey, data, error: null });
      },
      (err: unknown) => {
        if (active)
          setState({ key: requestKey, data: null, error: toApiError(err) });
      },
    );

    return () => {
      active = false;
    };
  }, [requestKey]);

  const refetch = useCallback(() => setReloadCount((count) => count + 1), []);

  return {
    data: state.data,
    error: state.error,
    loading: state.key !== requestKey,
    refetch,
  };
}
