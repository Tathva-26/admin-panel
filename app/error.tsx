"use client";

import { useEffect } from "react";

import Button from "@/components/ui/Button";

/**
 * Route-level error boundary, keeping a render-time throw inside <main> so the
 * sidebar and command palette stay usable.
 */
export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Route error:", error);
  }, [error]);

  return (
    <div className="px-6 py-12 text-center">
      <p className="text-sm font-medium text-foreground">
        This page hit an unexpected error.
      </p>

      <p className="mt-1 text-xs text-muted-foreground">
        The rest of the panel still works — use the sidebar to carry on.
      </p>

      {error.message ? (
        <p className="numeric mx-auto mt-3 max-w-xl break-words text-xs text-muted-foreground">
          {error.message}
          {error.digest ? ` · ${error.digest}` : ""}
        </p>
      ) : null}

      <div className="mt-4">
        <Button size="sm" onClick={reset}>
          Try again
        </Button>
      </div>
    </div>
  );
}
