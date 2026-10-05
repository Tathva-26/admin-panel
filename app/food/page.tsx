import { Suspense } from "react";

import FoodView from "@/components/food/FoodView";
import PageHeader from "@/components/layout/PageHeader";
import Spinner from "@/components/ui/Spinner";
import { getNavItem } from "@/lib/nav";

const nav = getNavItem("/food");

export default function FoodPage() {
  return (
    <>
      <PageHeader title={nav.label} description={nav.description} />
      <Suspense fallback={<Spinner />}>
        <FoodView />
      </Suspense>
    </>
  );
}
