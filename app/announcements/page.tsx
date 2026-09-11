import { Suspense } from "react";
import Link from "next/link";

import AnnouncementsList from "@/components/announcements/AnnouncementsList";
import PageHeader from "@/components/layout/PageHeader";
import Spinner from "@/components/ui/Spinner";
import { buttonClasses } from "@/components/ui/Button";
import { getNavItem } from "@/lib/nav";

const nav = getNavItem("/announcements");

export default function AnnouncementsPage() {
  return (
    <>
      <PageHeader
        title={nav.label}
        description={nav.description}
        actions={
          <Link
            href="/announcements?new=true"
            className={buttonClasses({ variant: "primary", size: "sm" })}
          >
            New announcement
          </Link>
        }
      />
      <Suspense
        fallback={
          <div className="flex justify-center py-16 text-muted-foreground">
            <Spinner />
          </div>
        }
      >
        <AnnouncementsList />
      </Suspense>
    </>
  );
}
