import { Suspense } from "react";

import BookingsList from "@/components/bookings/BookingsList";
import PageHeader from "@/components/layout/PageHeader";
import Spinner from "@/components/ui/Spinner";
import { getNavItem } from "@/lib/nav";

const nav = getNavItem("/bookings");

export default function BookingsPage() {
  return (
    <>
      <PageHeader title={nav.label} description={nav.description} />
      <Suspense
        fallback={
          <div className="flex justify-center py-16 text-muted-foreground">
            <Spinner />
          </div>
        }
      >
        <BookingsList />
      </Suspense>
    </>
  );
}
