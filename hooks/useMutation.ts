"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { fieldErrors, toApiError, type ApiError } from "@/lib/api/errors";

export interface UseMutationResult<TArgs extends unknown[], TResult> {
  /** Resolves with the result, or `null` if the request failed. */
  run: (...args: TArgs) => Promise<TResult | null>;
  loading: boolean;
  error: ApiError | null;
  /** Field name → message, ready to hand to <Field error={…} />. */
  fields: Record<string, string>;
  reset: () => void;
}

/**
 * Wraps a create/update/delete call with its own loading and error state.
 *
 * `run` resolves rather than throws, so a form can branch without try/catch:
 *
 *   const created = await create.run(body);
 *   if (created) router.push(`/events/${created.id}`);
 *
 * A 422 populates `fields`, so validation lands beside the right input without
 * any per-form wiring.
 */
export function useMutation<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
): UseMutationResult<TArgs, TResult> {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  // Callers pass a fresh closure every render. Keeping it in a ref lets `run`
  // have a stable identity (safe to put in a dependency array) while still
  // calling the current closure rather than the one from first render.
  const fnRef = useRef(fn);
  useEffect(() => {
    fnRef.current = fn;
  });

  const run = useCallback(
    async (...args: TArgs): Promise<TResult | null> => {
      setLoading(true);
      setError(null);
      try {
        return await fnRef.current(...args);
      } catch (err) {
        setError(toApiError(err));
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const reset = useCallback(() => setError(null), []);
  const fields = useMemo(() => fieldErrors(error), [error]);

  return { run, loading, error, fields, reset };
}
