import DashboardView from "@/components/dashboard/DashboardView";
import PageHeader from "@/components/layout/PageHeader";
import { getNavItem } from "@/lib/nav";

const nav = getNavItem("/");

export default function DashboardPage() {
  return (
    <>
      <PageHeader title={nav.label} description={nav.description} />
      <DashboardView />
    </>
  );
}
