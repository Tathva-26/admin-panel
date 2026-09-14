"use client";

import { useEffect, useState } from "react";

import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import { API_ORIGIN } from "@/lib/api/client";

/** How long to look like a normal load before admitting something is wrong. */
const PATIENCE_MS = 8_000;

/**
 * The screen shown while the session is being verified.
 *
 * Anything that stops `verifySession` from settling — an unreachable backend,
 * a request that never returns — would otherwise spin forever, so after a few
 * seconds this says what it is waiting on and offers a way out.
 */
export default function SessionLoading() {
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setSlow(true), PATIENCE_MS);
    return () => clearTimeout(id);
  }, []);

  const reset = () => {
    try {
      window.localStorage.removeItem("jwt");
    } catch {
      // Private mode or blocked storage — the reload below still helps.
    }
    window.location.reload();
  };

  return (
    <div className="flex h-dvh flex-col items-center justify-center gap-4 bg-background px-6 text-center">
      <Spinner className="h-8 w-8 text-foreground" />

      {slow ? (
        <div className="max-w-sm space-y-3">
          <p className="text-sm font-medium text-foreground">
            Still checking your session.
          </p>
          <p className="text-xs text-muted-foreground">
            The panel is waiting on{" "}
            <span className="numeric">{API_ORIGIN}</span>. If the backend is not
            running, or is running on a different port than{" "}
            <code className="numeric">NEXT_PUBLIC_API_URL</code> expects, it will
            never answer.
          </p>
          <Button size="sm" onClick={reset}>
            Sign out and retry
          </Button>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">Checking your session…</p>
      )}
    </div>
  );
}
