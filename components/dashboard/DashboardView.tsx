"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";

import ErrorState from "@/components/ui/ErrorState";
import { useApi } from "@/hooks/useApi";
import { getDashboard } from "@/lib/api/dashboard";
import { listBookings } from "@/lib/api/bookings";
import { listEvents } from "@/lib/api/events";
import { listAnnouncements } from "@/lib/api/announcements";
import { findEventIssues } from "@/lib/attention";
import { DASHBOARD_REFRESH_EVENT } from "@/lib/refresh";
import type {
  AdminEvent,
  Announcement,
  Booking,
  DashboardStats,
  ListResponse,
} from "@/types";

import AttentionPanel from "./AttentionPanel";

const ATTENTION_SAMPLE_SIZE = 100;

export default function DashboardView() {
  const stats = useApi<DashboardStats>("dashboard", getDashboard);

  const events = useApi<ListResponse<AdminEvent>>(
    "dashboard:events:featured",
    () => listEvents({ pageSize: 4 }),
  );

  const attentionEvents = useApi<ListResponse<AdminEvent>>(
    `dashboard:events:${ATTENTION_SAMPLE_SIZE}`,
    () => listEvents({ pageSize: ATTENTION_SAMPLE_SIZE }),
  );

  const announcements = useApi<ListResponse<Announcement>>(
    "dashboard:announcements",
    () => listAnnouncements({ pageSize: 3, published: true }),
  );

  const bookings = useApi<ListResponse<Booking>>(
    "dashboard:bookings",
    () => listBookings({ pageSize: 3, status: "PENDING" }),
  );

  const refetchStats = stats.refetch;
  const refetchEvents = events.refetch;
  const refetchAttentionEvents = attentionEvents.refetch;
  const refetchAnnouncements = announcements.refetch;
  const refetchBookings = bookings.refetch;

  useEffect(() => {
    const refresh = () => {
      refetchStats();
      refetchEvents();
      refetchAttentionEvents();
      refetchAnnouncements();
      refetchBookings();
    };

    window.addEventListener(DASHBOARD_REFRESH_EVENT, refresh);
    return () => window.removeEventListener(DASHBOARD_REFRESH_EVENT, refresh);
  }, [
    refetchStats,
    refetchEvents,
    refetchAttentionEvents,
    refetchAnnouncements,
    refetchBookings,
  ]);

  const issues = useMemo(
    () => findEventIssues(attentionEvents.data?.items ?? []),
    [attentionEvents.data],
  );

  if (stats.error) {
    return (
      <div className="rounded-md border border-border bg-card p-6">
        <ErrorState error={stats.error} onRetry={stats.refetch} />
      </div>
    );
  }

  const statsData = stats.data ?? {
    events: { total: 0, published: 0, drafts: 0 },
    announcements: { total: 0, published: 0 },
    users: 0,
    bookings: { total: 0, pending: 0, confirmed: 0, failed: 0 },
    contactMessages: { new: 0 },
  };

  const eventsList = events.data?.items ?? [];
  const announcementsList = announcements.data?.items ?? [];
  const bookingsList = bookings.data?.items ?? [];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:hidden">
        <Link
          href="/events?new=true"
          className="inline-flex items-center justify-center gap-1.5 rounded-md bg-primary hover:bg-accent px-3.5 py-2 text-xs font-semibold text-primary-foreground shadow-2xs transition-colors"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          <span>Add Event</span>
        </Link>
        <Link
          href="/announcements?new=true"
          className="inline-flex items-center justify-center gap-1.5 rounded-md bg-primary hover:bg-accent px-3.5 py-2 text-xs font-semibold text-primary-foreground shadow-2xs transition-colors"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          <span>Add Announcement</span>
        </Link>
      </div>

      <div className="grid grid-cols-12 gap-5">
        
        {/* LEFT COLUMN (Cols 12 lg:col-span-8) */}
        <div className="col-span-12 lg:col-span-8 space-y-5">
          
          {/* 1. Top 2 Horizontal Summary Cards side by side */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Card 1: Events Overview */}
            <div className="bg-card rounded-md p-4 border border-border flex items-center gap-3.5">
              <div className="w-9 h-9 rounded bg-muted border border-border text-foreground font-extrabold text-xs flex items-center justify-center shrink-0">
                EV
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider truncate">
                  Events Overview
                </h3>
                <p className="text-xs text-muted-foreground font-medium mt-0.5">
                  {stats.loading ? (
                    <span className="text-muted-foreground">Loading...</span>
                  ) : (
                    <>
                      Published:{" "}
                      <span className="font-bold text-foreground">
                        {statsData.events.published}
                      </span>
                      {" "}/ {statsData.events.total} Events
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* Card 2: Bookings Overview */}
            <div className="bg-card rounded-md p-4 border border-border flex items-center gap-3.5">
              <div className="w-9 h-9 rounded bg-muted border border-border text-foreground font-extrabold text-xs flex items-center justify-center shrink-0">
                BK
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider truncate">
                  Bookings Overview
                </h3>
                <p className="text-xs text-muted-foreground font-medium mt-0.5">
                  {stats.loading ? (
                    <span className="text-muted-foreground">Loading...</span>
                  ) : (
                    <>
                      Confirmed:{" "}
                      <span className="font-bold text-foreground">
                        {statsData.bookings.confirmed}
                      </span>
                      {" "}/ {statsData.bookings.total} Bookings
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* 2. Middle Section: Events horizontal card grid */}
          <div className="bg-card rounded-md p-5 border border-border space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-sm font-bold text-foreground">
                Events
              </h2>
              <Link
                href="/events"
                className="text-xs font-bold text-foreground hover:underline flex items-center gap-1"
              >
                View all &gt;
              </Link>
            </div>

            {events.loading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
                {Array.from({ length: 4 }).map((_, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="h-28 rounded-md bg-muted border border-border animate-pulse" />
                    <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
                  </div>
                ))}
              </div>
            ) : events.error ? (
              <ErrorState error={events.error} onRetry={events.refetch} />
            ) : eventsList.length === 0 ? (
              <p className="py-8 text-center text-xs font-medium text-muted-foreground">
                No events created yet.
              </p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
                {eventsList.slice(0, 4).map((event) => (
                  <Link
                    key={event.id}
                    href={`/events`}
                    className="group block space-y-2"
                  >
                    {/* NO GRADIENTS — Use simple solid gray surface if image is absent */}
                    <div className="h-28 rounded-md overflow-hidden bg-muted border border-border relative">
                      {event.picture ? (
                        // next/image needs every remote host declared up front
                        // in remotePatterns. This URL is typed into the event
                        // form by an admin, so the host is not knowable at
                        // build time.
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={event.picture}
                          alt={event.heading}
                          className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                        />
                      ) : (
                        <div className="w-full h-full bg-muted text-foreground font-bold text-xs p-3 flex items-center justify-center text-center">
                          {event.heading}
                        </div>
                      )}
                    </div>
                    <h3 className="text-xs font-bold text-foreground truncate group-hover:text-foreground">
                      {event.heading}
                    </h3>
                    <p className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
                      <svg
                        className="w-3 h-3 text-muted-foreground shrink-0"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      <span className="truncate">
                        {event.datetime
                          ? new Date(event.datetime).toLocaleDateString(
                              "en-US",
                              { month: "short", day: "numeric", hour: "2-digit" },
                            )
                          : "Schedule TBA"}
                      </span>
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* 3. Bottom Row: Announcements & Pending Bookings Panels */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Announcements Panel */}
            <div className="bg-card rounded-md p-5 border border-border space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h2 className="text-sm font-bold text-foreground">
                  Announcements
                </h2>
                <Link
                  href="/announcements"
                  className="text-xs font-bold text-foreground hover:underline flex items-center gap-1"
                >
                  View all &gt;
                </Link>
              </div>

              {announcements.loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="h-8 animate-pulse rounded bg-muted" />
                  ))}
                </div>
              ) : announcements.error ? (
                <ErrorState
                  error={announcements.error}
                  onRetry={announcements.refetch}
                />
              ) : announcementsList.length === 0 ? (
                <p className="py-6 text-center text-xs font-medium text-muted-foreground">
                  No announcements published.
                </p>
              ) : (
                <div>
                  {announcementsList.slice(0, 3).map((ann) => (
                    <div key={ann.id} className="pt-3 first:pt-0 flex items-start gap-3">
                      <div className="w-7 h-7 rounded bg-muted border border-border text-foreground font-bold flex items-center justify-center shrink-0 text-xs">
                        <svg className="w-3.5 h-3.5 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                        </svg>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-xs font-bold text-foreground truncate">
                            {ann.title}
                          </h4>
                          <span className="text-[10px] text-muted-foreground font-medium shrink-0">
                            {new Date(ann.createdAt).toLocaleDateString(
                              "en-US",
                              { day: "numeric", month: "short" },
                            )}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5 font-medium">
                          {ann.content}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pending Bookings Panel */}
            <div className="bg-card rounded-md p-5 border border-border space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h2 className="text-sm font-bold text-foreground">
                  Your Pending Bookings
                </h2>
                <Link
                  href="/bookings"
                  className="text-xs font-bold text-foreground hover:underline flex items-center gap-1"
                >
                  View all &gt;
                </Link>
              </div>

              {bookings.loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="h-8 animate-pulse rounded bg-muted" />
                  ))}
                </div>
              ) : bookings.error ? (
                <ErrorState error={bookings.error} onRetry={bookings.refetch} />
              ) : bookingsList.length === 0 ? (
                <p className="py-6 text-center text-xs font-medium text-muted-foreground">
                  No bookings found.
                </p>
              ) : (
                <div className="space-y-3 divide-y divide-border">
                  {bookingsList.slice(0, 3).map((b) => (
                    <div
                      key={b.bookingUid}
                      className="pt-3 first:pt-0 flex items-center justify-between gap-2.5"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded bg-muted border border-border text-foreground font-bold text-[10px] flex items-center justify-center shrink-0">
                          BK
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-foreground truncate">
                            {b.event?.heading ||
                              b.user?.name ||
                              "Booking #" + b.bookingUid}
                          </h4>
                          <p className="text-[10px] text-muted-foreground font-medium flex items-center gap-1 mt-0.5">
                            <span>
                              {new Date(b.createdAt).toLocaleDateString(
                                "en-US",
                                { month: "short", day: "numeric" },
                              )}
                            </span>
                            •
                            <span className="text-foreground font-semibold">
                              {b.qty} Ticket{b.qty > 1 ? "s" : ""}
                            </span>
                          </p>
                        </div>
                      </div>

                      {/* NO PILLS — Compact Rectangular Status Badge */}
                      <span className="bg-warning/15 text-warning text-[10px] font-bold px-2 py-0.5 rounded border border-warning/40 uppercase tracking-wider shrink-0">
                        {b.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>

        {/* RIGHT COLUMN (Cols 12 lg:col-span-4) */}
        <div className="col-span-12 lg:col-span-4 space-y-5">

          {/* 1. Needs Attention Panel */}
          <AttentionPanel
            items={issues}
            loading={attentionEvents.loading}
            error={attentionEvents.error}
            onRetry={attentionEvents.refetch}
            checked={attentionEvents.data?.items.length ?? 0}
          />
          {/* 2. Ticket Selling Panel */}
          <div className="bg-card rounded-md p-5 border border-border space-y-4">
            <h2 className="text-sm font-bold text-foreground border-b border-border pb-3">
              Ticket Selling
            </h2>

            {stats.loading ? (
              <div className="grid grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="space-y-2.5">
                    <div className="h-3 w-3/4 animate-pulse rounded bg-muted" />
                    <div className="h-14 animate-pulse rounded-sm bg-muted" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: "Registered Users", value: statsData.users },
                  { label: "Draft Events", value: statsData.events.drafts },
                  { label: "Failed Bookings", value: statsData.bookings.failed },
                ].map((stat) => (
                  <div key={stat.label} className="space-y-2.5">
                    <p className="text-[11px] text-muted-foreground font-medium truncate">
                      {stat.label}
                    </p>
                    <div className="flex gap-1">
                      {String(stat.value)
                        .padStart(2, "0")
                        .split("")
                        .map((digit, i) => (
                          <div
                            key={i}
                            className="relative w-11 h-14 rounded-sm bg-primary overflow-hidden flex items-center justify-center"
                          >
                            <span className="text-primary-foreground text-3xl font-bold font-mono">
                              {digit}
                            </span>
                            <div className="absolute left-0 right-0 top-1/2 h-px bg-background/50" />
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}


