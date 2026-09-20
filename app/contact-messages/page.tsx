import { Suspense } from "react";

import ContactsList from "@/components/contacts/ContactsList";
import PageHeader from "@/components/layout/PageHeader";
import Spinner from "@/components/ui/Spinner";
import { getNavItem } from "@/lib/nav";

const nav = getNavItem("/contact-messages");

export default function ContactMessagesPage() {
  return (
    <>
      <PageHeader title={nav.label} description={nav.description} />
      {/*
        ContactsList reads filters from the URL via useSearchParams, which opts
        its subtree out of prerendering unless it sits behind a Suspense
        boundary.
      */}
      <Suspense
        fallback={
          <div className="flex justify-center py-16 text-muted-foreground">
            <Spinner />
          </div>
        }
      >
        <ContactsList />
      </Suspense>
    </>
  );
}
