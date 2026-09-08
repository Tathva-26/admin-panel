import { Suspense } from "react";

import AnnouncementsList from "@/components/announcements/AnnouncementsList";
import PageHeader from "@/components/layout/PageHeader";
import Spinner from "@/components/ui/Spinner";
import { getNavItem } from "@/lib/nav";

const nav = getNavItem("/announcements");

export default function AnnouncementsPage() {
  return (
    <>
      <PageHeader title={nav.label} description={nav.description} />
      <Suspense
        fallback={
          <div className="flex justify-center py-16 text-zinc-400">
            <Spinner />
          </div>
        }
      >
        <AnnouncementsList />
      </Suspense>
    </>
  );
}
