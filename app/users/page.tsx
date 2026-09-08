import { Suspense } from "react";

import PageHeader from "@/components/layout/PageHeader";
import Spinner from "@/components/ui/Spinner";
import UsersList from "@/components/users/UsersList";
import { getNavItem } from "@/lib/nav";

const nav = getNavItem("/users");

export default function UsersPage() {
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
        <UsersList />
      </Suspense>
    </>
  );
}
