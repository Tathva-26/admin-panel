import { Suspense } from "react";

import PageHeader from "@/components/layout/PageHeader";
import Spinner from "@/components/ui/Spinner";
import VenuesList from "@/components/venues/VenuesList";
import { getNavItem } from "@/lib/nav";

const nav = getNavItem("/venues");

export default function VenuesPage() {
  return (
    <>
      <PageHeader title={nav.label} description={nav.description} />
      {/* VenuesList reads filters from the URL, so it needs a boundary. */}
      <Suspense
        fallback={
          <div className="flex justify-center py-16 text-zinc-400">
            <Spinner />
          </div>
        }
      >
        <VenuesList />
      </Suspense>
    </>
  );
}
