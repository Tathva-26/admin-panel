"use client";

import { useEffect } from "react";

import "./globals.css";

/**
 * Last-resort boundary for throws in the root layout, where `app/error.tsx`
 * cannot help. Next replaces the whole document, so this renders its own
 * <html>/<body> and stays plain — it must not depend on the shell it replaces.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">
        <div className="mx-auto max-w-lg px-6 py-24 text-center">
          <h1 className="text-base font-semibold text-foreground">
            The admin panel failed to load.
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            Something threw before the interface could render.
          </p>

          {error.message ? (
            <p className="numeric mt-4 break-words text-xs text-muted-foreground">
              {error.message}
              {error.digest ? ` · ${error.digest}` : ""}
            </p>
          ) : null}

          <button
            type="button"
            onClick={reset}
            className="mt-6 inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:bg-primary/80"
          >
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}
