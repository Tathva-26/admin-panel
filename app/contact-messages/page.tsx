import { Suspense } from "react";

import ContactMessagesList from "@/components/contact/ContactMessagesList";
import PageHeader from "@/components/layout/PageHeader";
import Spinner from "@/components/ui/Spinner";
import { getNavItem } from "@/lib/nav";

const nav = getNavItem("/contact-messages");

export default function ContactMessagesPage() {
  return (
    <>
      {/* No page action: messages arrive from the public site, they are not
          created here. */}
      <PageHeader title={nav.label} description={nav.description} />
      <Suspense
        fallback={
          <div className="flex justify-center py-16 text-muted-foreground">
            <Spinner />
          </div>
        }
      >
        <ContactMessagesList />
      </Suspense>
    </>
  );
}
