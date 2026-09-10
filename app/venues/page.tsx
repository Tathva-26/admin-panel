import { Suspense } from "react";
import Link from "next/link";

import PageHeader from "@/components/layout/PageHeader";
import Spinner from "@/components/ui/Spinner";
import { buttonClasses } from "@/components/ui/Button";
import VenuesList from "@/components/venues/VenuesList";
import { getNavItem } from "@/lib/nav";

const nav = getNavItem("/venues");

export default function VenuesPage() {
  return (
    <>
      <PageHeader
        title={nav.label}
        description={nav.description}
        actions={
          <Link
            href="/venues?new=true"
            className={buttonClasses({ variant: "primary", size: "sm" })}
          >
            New venue
          </Link>
        }
      />
      {/* VenuesList reads filters from the URL, so it needs a boundary. */}
      <Suspense
        fallback={
          <div className="flex justify-center py-16 text-muted-foreground">
            <Spinner />
          </div>
        }
      >
        <VenuesList />
      </Suspense>
    </>
  );
}
