import { Suspense } from "react";

import EventsList from "@/components/events/EventsList";
import PageHeader from "@/components/layout/PageHeader";
import Spinner from "@/components/ui/Spinner";
import { getNavItem } from "@/lib/nav";

const nav = getNavItem("/events");

export default function EventsPage() {
  return (
    <>
      <PageHeader title={nav.label} description={nav.description} />
      {/*
        EventsList reads filters from the URL via useSearchParams, which opts
        its subtree out of prerendering unless it sits behind a Suspense
        boundary.
      */}
      <Suspense
        fallback={
          <div className="flex justify-center py-16 text-zinc-400">
            <Spinner />
          </div>
        }
      >
        <EventsList />
      </Suspense>
    </>
  );
}
