"use client";

import Link from "next/link";

import ErrorState from "@/components/ui/ErrorState";
import { buttonClasses } from "@/components/ui/Button";
import type { ApiError } from "@/lib/api/errors";
import type { AttentionItem } from "@/lib/attention";

const SKELETON_ROWS = 3;

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
  function renderContent() {
    if (error) return <ErrorState error={error} onRetry={onRetry} />;

    if (loading) {
      return (
        <div className="space-y-3">
          {Array.from({ length: SKELETON_ROWS }, (_, index) => (
            <div
              key={`skeleton-${index}`}
              className="flex items-center justify-between border-b border-zinc-100 py-2 last:border-0"
            >
              <div className="h-4 w-3/4 animate-pulse rounded bg-zinc-100" />
              <div className="h-6 w-12 animate-pulse rounded bg-zinc-100" />
            </div>
          ))}
        </div>
      );
    }

    if (items.length === 0) {
      return (
        <p className="py-6 text-center text-xs font-medium text-zinc-500">
          Nothing to flag across {checked} event{checked === 1 ? "" : "s"}.
        </p>
      );
    }

    return (
      <div className="divide-y divide-zinc-100">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-zinc-900">
                {item.issue}
              </p>
              <p className="mt-0.5 truncate text-[11px] font-medium text-zinc-500">
                &ldquo;{item.heading}&rdquo;
              </p>
            </div>

            {/* Shares the button styles rather than restating them — this one
                had its own padding, weight and uppercase tracking. */}
            <Link
              href={`/events?eventId=${item.eventId}`}
              className={buttonClasses({ variant: "primary", size: "sm" })}
            >
              Check
            </Link>
          </div>
        ))}
      </div>
    );
  }

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
      </div>

      {/* Content */}
      {renderContent()}
    </section>
  );
}
