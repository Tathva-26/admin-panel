import { Suspense } from "react";

import AccommodationView from "@/components/accommodation/AccommodationView";
import PageHeader from "@/components/layout/PageHeader";
import Spinner from "@/components/ui/Spinner";
import { getNavItem } from "@/lib/nav";

const nav = getNavItem("/accommodation");

export default function AccommodationPage() {
  return (
    <>
      <PageHeader title={nav.label} description={nav.description} />
      <Suspense fallback={<Spinner />}>
        <AccommodationView />
      </Suspense>
    </>
  );
}
