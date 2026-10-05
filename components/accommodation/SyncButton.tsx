"use client";

import { useState } from "react";

import Button from "@/components/ui/Button";
import { useMutation } from "@/hooks/useMutation";
import { syncWithTiqr } from "@/lib/api/accommodation";
import type { ReconcileLedgerResult } from "@/types";

function describe(label: string, ledger: ReconcileLedgerResult) {
  const moved = Object.entries(ledger.moved)
    .map(([status, count]) => `${count} ${status.toLowerCase()}`)
    .join(", ");
  return `${label}: checked ${ledger.checked}${moved ? `, ${moved}` : ", nothing changed"}${
    ledger.failed ? `, ${ledger.failed} lookup(s) failed` : ""
  }`;
}

/**
 * Runs the TIQR status sync now instead of waiting for the 5-minute job:
 * paid bookings become confirmed, failed ones and carts unpaid after 30
 * minutes release their beds. Covers rooms and food together.
 */
export default function SyncButton({ onDone }: { onDone: () => void }) {
  const sync = useMutation(syncWithTiqr);
  const [summary, setSummary] = useState<string | null>(null);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button
        variant="secondary"
        size="sm"
        disabled={sync.loading}
        onClick={async () => {
          setSummary(null);
          const result = await sync.run();
          if (!result) return;
          setSummary(
            `${describe("Rooms", result.accommodation)} · ${describe("Food", result.food)}`,
          );
          onDone();
        }}
      >
        {sync.loading ? "Syncing with TIQR…" : "Sync with TIQR now"}
      </Button>
      {sync.error ? (
        <span className="text-xs text-red-400">{sync.error.message}</span>
      ) : summary ? (
        <span className="text-xs text-muted-foreground">{summary}</span>
      ) : null}
    </div>
  );
}
