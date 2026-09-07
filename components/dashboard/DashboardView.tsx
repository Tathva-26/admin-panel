"use client";

import { useMemo } from "react";

import ErrorState from "@/components/ui/ErrorState";
import { useApi } from "@/hooks/useApi";
import { getDashboard } from "@/lib/api/dashboard";
import { listEvents } from "@/lib/api/events";
import { findEventIssues } from "@/lib/attention";
import type { AdminEvent, DashboardStats, ListResponse } from "@/types";

import AttentionPanel from "./AttentionPanel";
import StatCard from "./StatCard";

/**
 * The checks run client-side over one page of events rather than asking the
 * backend for them — there is no endpoint for it, and a fest has hundreds of
 * events, not millions. If that stops being true this moves server-side.
 */
const ATTENTION_SAMPLE_SIZE = 100;

export default function DashboardView() {
  const stats = useApi<DashboardStats>("dashboard", getDashboard);

  const events = useApi<ListResponse<AdminEvent>>(
    `dashboard:events:${ATTENTION_SAMPLE_SIZE}`,
    () => listEvents({ pageSize: ATTENTION_SAMPLE_SIZE }),
  );

  const issues = useMemo(
    () => findEventIssues(events.data?.items ?? []),
    [events.data],
  );

  return (
    <div className="space-y-5">
      {/*
        Counts and checks fail independently — one endpoint being down should
        not blank the other half of the page.
      */}
      {stats.error ? (
        <div className="rounded-lg border border-zinc-200 bg-white">
          <ErrorState error={stats.error} onRetry={stats.refetch} />
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Events"
            value={stats.data?.events.total ?? null}
            loading={stats.loading}
            subStats={[
              { label: "Published", value: stats.data?.events.published ?? 0 },
              { label: "Drafts", value: stats.data?.events.drafts ?? 0 },
            ]}
          />
          <StatCard
            label="Announcements"
            value={stats.data?.announcements.total ?? null}
            loading={stats.loading}
            subStats={[
              {
                label: "Published",
                value: stats.data?.announcements.published ?? 0,
              },
            ]}
          />
          <StatCard
            label="Users"
            value={stats.data?.users ?? null}
            loading={stats.loading}
          />
          <StatCard
            label="Bookings"
            value={stats.data?.bookings.total ?? null}
            loading={stats.loading}
            subStats={[
              { label: "Confirmed", value: stats.data?.bookings.confirmed ?? 0 },
              { label: "Pending", value: stats.data?.bookings.pending ?? 0 },
              { label: "Failed", value: stats.data?.bookings.failed ?? 0 },
            ]}
          />
        </div>
      )}

      <AttentionPanel
        items={issues}
        loading={events.loading}
        error={events.error}
        onRetry={events.refetch}
        checked={events.data?.items.length ?? 0}
      />
    </div>
  );
}
