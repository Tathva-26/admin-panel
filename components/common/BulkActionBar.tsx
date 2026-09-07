"use client";

import type { ReactNode } from "react";

import Button from "@/components/ui/Button";

/**
 * Appears once rows are selected and sticks to the bottom of the scroll area,
 * so the actions stay reachable however far down the list you are.
 */
export default function BulkActionBar({
  count,
  onClear,
  children,
}: {
  count: number;
  onClear: () => void;
  /** The actions themselves — usually a couple of Buttons. */
  children: ReactNode;
}) {
  if (count === 0) return null;

  return (
    <div className="sticky bottom-0 z-20 -mx-4 mt-3 border-t border-zinc-200 bg-white/95 px-4 py-2.5 backdrop-blur sm:-mx-6 sm:px-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-zinc-600">
          <span className="numeric font-medium text-zinc-900">{count}</span>{" "}
          selected
        </p>

        <div className="flex items-center gap-2">
          {children}
          <Button size="sm" variant="ghost" onClick={onClear}>
            Clear
          </Button>
        </div>
      </div>
    </div>
  );
}
