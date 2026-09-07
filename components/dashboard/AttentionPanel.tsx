"use client";

import Link from "next/link";

import Badge from "@/components/ui/Badge";
import ErrorState from "@/components/ui/ErrorState";
import type { ApiError } from "@/lib/api/errors";
import type { AttentionItem } from "@/lib/attention";

interface AttentionPanelProps {
  items: AttentionItem[];
  loading: boolean;
  error: ApiError | null;
  onRetry: () => void;
  /** How many events the checks ran over, for the all-clear line. */
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
    <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
      <header className="flex items-center justify-between border-b border-zinc-200 px-4 py-2.5">
        <h2 className="text-sm font-semibold text-zinc-900">Needs attention</h2>
        {!loading && !error && items.length > 0 ? (
          <span className="numeric text-xs text-zinc-500">{items.length}</span>
        ) : null}
      </header>

      {error ? (
        <ErrorState error={error} onRetry={onRetry} />
      ) : loading ? (
        <ul className="divide-y divide-zinc-100">
          {Array.from({ length: 3 }, (_, index) => (
            <li key={index} className="px-4 py-3">
              <span className="block h-4 w-2/3 animate-pulse rounded bg-zinc-100" />
            </li>
          ))}
        </ul>
      ) : items.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-zinc-500">
          Nothing to flag across {checked} event{checked === 1 ? "" : "s"}.
        </p>
      ) : (
        <ul className="divide-y divide-zinc-100">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex flex-col gap-1 px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
            >
              <div className="min-w-0">
                <Link
                  href={`/events?search=${encodeURIComponent(item.heading)}`}
                  className="truncate text-sm font-medium text-zinc-900 hover:underline"
                >
                  {item.heading}
                </Link>
                <p className="text-sm text-zinc-500">{item.issue}</p>
              </div>

              <Badge tone={item.severity === "warn" ? "amber" : "neutral"}>
                {item.severity === "warn" ? "Fix" : "Check"}
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
