"use client";

import Link from "next/link";

import ErrorState from "@/components/ui/ErrorState";
import type { ApiError } from "@/lib/api/errors";
import type { AttentionItem } from "@/lib/attention";

interface AttentionPanelProps {
  items: AttentionItem[];
  loading: boolean;
  error: ApiError | null;
  onRetry: () => void;
  checked: number;
}

export default function AttentionPanel({
  items,
  loading,
  error,
  onRetry,
  checked,
}: AttentionPanelProps) {
  return (
    <section className="bg-white rounded-md border border-zinc-200 p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-extrabold text-zinc-900">Needs attention</h2>
          {!loading && !error && items.length > 0 ? (
            <span className="bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded text-xs">
              {items.length}
            </span>
          ) : null}
        </div>
        <button className="text-zinc-400 hover:text-zinc-600 text-xs font-bold tracking-widest p-1">
          •••
        </button>
      </div>

      {/* Content */}
      {error ? (
        <ErrorState error={error} onRetry={onRetry} />
      ) : loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="flex items-center justify-between py-2 border-b border-zinc-100 last:border-0">
              <div className="h-4 w-3/4 animate-pulse rounded bg-zinc-100" />
              <div className="h-6 w-12 animate-pulse rounded bg-zinc-100" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="py-6 text-center text-xs font-medium text-zinc-500">
          Nothing to flag across {checked} event{checked === 1 ? "" : "s"}.
        </p>
      ) : (
        <div className="divide-y divide-zinc-100">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
            >
              <div className="min-w-0 flex-1">
                <Link
                  href={`/events?search=${encodeURIComponent(item.heading)}`}
                  className="truncate text-xs font-bold text-zinc-900 hover:text-blue-600 block"
                >
                  {item.issue} for &ldquo;{item.heading}&rdquo;
                </Link>
                <Link
                  href={`/events?search=${encodeURIComponent(item.heading)}`}
                  className="text-[11px] font-semibold text-zinc-900 hover:underline block mt-0.5"
                >
                  (linked)
                </Link>
              </div>

              {/* Compact Rectangular Status Controls */}
              <Link
                href={`/events?search=${encodeURIComponent(item.heading)}`}
                className={
                  item.severity === "warn"
                    ? "bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-3 py-1 rounded text-center shrink-0 uppercase tracking-wider"
                    : "bg-zinc-200 hover:bg-zinc-300 text-zinc-800 font-bold text-xs px-3 py-1 rounded text-center shrink-0 uppercase tracking-wider"
                }
              >
                {item.severity === "warn" ? "Fix" : "Check"}
              </Link>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}


