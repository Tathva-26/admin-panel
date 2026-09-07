import NotBuiltYet from "@/components/common/NotBuiltYet";
import PageHeader from "@/components/layout/PageHeader";
import { getNavItem } from "@/lib/nav";

const nav = getNavItem("/users");

export default function UsersPage() {
  return (
    <>
      <PageHeader title={nav.label} description={nav.description} />
      <NotBuiltYet owner="partner" />
    </>
  );
}
