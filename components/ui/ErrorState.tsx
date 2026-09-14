"use client";

import { isRetryable, type ApiError } from "@/lib/api/errors";

import Button from "./Button";

/**
 * The screen behind every failed request.
 *
 * States what actually went wrong — status and code included — rather than a
 * generic apology.
 */
export default function ErrorState({
  error,
  onRetry,
}: {
  error: ApiError;
  onRetry?: () => void;
}) {
  const retryable = isRetryable(error);

  return (
    <div className="px-6 py-12 text-center">
      <p className="text-sm font-medium text-foreground">{error.message}</p>

      <p className="numeric mt-1 text-xs text-muted-foreground">
        {error.status ? `${error.status} · ` : ""}
        {error.code}
      </p>

      {error.retryAfter ? (
        <p className="mt-2 text-xs text-muted-foreground">
          Try again in {error.retryAfter}s.
        </p>
      ) : null}

      {onRetry && retryable ? (
        <div className="mt-4">
          <Button size="sm" onClick={onRetry}>
            Try again
          </Button>
        </div>
      ) : null}
    </div>
  );
}
