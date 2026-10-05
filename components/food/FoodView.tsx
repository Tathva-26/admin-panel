"use client";

import Badge, { type BadgeTone } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import SyncButton from "@/components/accommodation/SyncButton";
import InlineNumber from "@/components/ui/InlineNumber";
import Spinner from "@/components/ui/Spinner";
import { useApi } from "@/hooks/useApi";
import { useMutation } from "@/hooks/useMutation";
import { getFood, listFoodOrders, updateFoodRate } from "@/lib/api/food";
import { formatDateTime, rupeeInputToPaise } from "@/lib/format";
import type { Diet } from "@/types";

const DAYS = [1, 2, 3];
const DIETS: Diet[] = ["VEG", "NONVEG"];

const dietName = (diet: Diet) => (diet === "VEG" ? "Veg" : "Non-Veg");

const STATUS_TONE: Record<string, BadgeTone> = {
  CONFIRMED: "green",
  PENDING: "amber",
  FAILED: "red",
};

export default function FoodView() {
  const summary = useApi("food", getFood);
  const orders = useApi("food-orders", listFoodOrders);
  const rateMutation = useMutation(updateFoodRate);

  if (summary.loading && !summary.data) return <Spinner className="h-6 w-6" />;
  if (summary.error) {
    return <ErrorState error={summary.error} onRetry={summary.refetch} />;
  }
  if (!summary.data) return null;

  const { eventId, rates, kitchen, orders: byStatus } = summary.data;

  const cooked = (day: number, diet: Diet) =>
    kitchen.find((row) => row.day === day && row.diet === diet)?.quantity ?? 0;

  const unprovisioned = rates.filter((row) => !row.tiqrTicketId).length;

  const refresh = () => {
    summary.refetch();
    orders.refetch();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="secondary" size="sm" onClick={refresh}>
          Refresh
        </Button>
        <SyncButton onDone={refresh} />
      </div>

      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
        <span>
          {eventId ? `TIQR event #${eventId}` : "No TIQR food event yet"}
        </span>
        {byStatus.map((row) => (
          <span key={row.status} className="inline-flex items-center gap-1.5">
            <span aria-hidden>·</span>
            <Badge tone={STATUS_TONE[row.status] ?? "neutral"}>
              {row.status}
            </Badge>
            {row.count} order{row.count === 1 ? "" : "s"}
          </span>
        ))}
      </div>

      {unprovisioned > 0 ? (
        <Card className="border-amber-500/40 bg-amber-500/5">
          <p className="text-sm text-amber-300">
            {unprovisioned} coupon{unprovisioned === 1 ? "" : "s"} ha
            {unprovisioned === 1 ? "s" : "ve"} no TIQR ticket yet, so they
            cannot be sold. Run{" "}
            <code className="rounded bg-black/30 px-1">
              provision-food.js --provision
            </code>{" "}
            on the backend.
          </p>
        </Card>
      ) : null}

      {/* What catering has to cook */}
      <Card>
        <h2 className="mb-1 text-sm font-semibold">Kitchen</h2>
        <p className="mb-4 text-xs text-muted-foreground">
          Breakfast + lunch per day. Counts paid and still-pending orders, not
          failed ones.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="pb-2 pr-4 font-medium">Day</th>
                {DIETS.map((diet) => (
                  <th key={diet} className="pb-2 pr-4 font-medium">
                    {dietName(diet)}
                  </th>
                ))}
                <th className="pb-2 font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {DAYS.map((day) => (
                <tr key={day} className="border-b border-border/50">
                  <td className="py-2 pr-4">Day {day}</td>
                  {DIETS.map((diet) => (
                    <td key={diet} className="py-2 pr-4 tabular-nums">
                      {cooked(day, diet)}
                    </td>
                  ))}
                  <td className="py-2 tabular-nums font-medium">
                    {DIETS.reduce((sum, diet) => sum + cooked(day, diet), 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Pricing */}
      <Card>
        <h2 className="mb-1 text-sm font-semibold">Coupon prices</h2>
        <p className="mb-4 text-xs text-muted-foreground">
          Saving also reprices the ticket on TIQR; if that fails nothing is
          saved here either.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="pb-2 pr-4 font-medium">Day</th>
                <th className="pb-2 pr-4 font-medium">Diet</th>
                <th className="pb-2 pr-4 font-medium">Price (₹)</th>
                <th className="pb-2 font-medium">TIQR</th>
              </tr>
            </thead>
            <tbody>
              {rates.map((row) => (
                <tr key={row.id} className="border-b border-border/50">
                  <td className="py-2 pr-4">Day {row.day}</td>
                  <td className="py-2 pr-4 text-muted-foreground">
                    {dietName(row.diet)}
                  </td>
                  <td className="py-2 pr-4">
                    <InlineNumber
                      initial={String(row.price / 100)}
                      disabled={rateMutation.loading}
                      onCommit={async (value) => {
                        const paise = rupeeInputToPaise(value);
                        if (paise === null || paise === row.price) return;
                        await rateMutation.run(row.id, paise);
                        summary.refetch();
                      }}
                    />
                  </td>
                  <td className="py-2">
                    {row.tiqrTicketId ? (
                      <span className="text-xs tabular-nums text-muted-foreground">
                        #{row.tiqrTicketId}
                      </span>
                    ) : (
                      <Badge tone="amber">Not on sale</Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {rateMutation.error ? (
          <p className="mt-3 text-xs text-red-400">
            {rateMutation.error.message}
          </p>
        ) : null}
      </Card>

      {/* Orders */}
      <Card>
        <h2 className="mb-1 text-sm font-semibold">Orders</h2>
        <p className="mb-4 text-xs text-muted-foreground">
          Newest first.
        </p>

        {orders.loading && !orders.data ? (
          <Spinner className="h-5 w-5" />
        ) : orders.error ? (
          <ErrorState error={orders.error} onRetry={orders.refetch} />
        ) : !orders.data?.orders.length ? (
          <EmptyState title="No food orders yet" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="pb-2 pr-4 font-medium">Placed</th>
                  <th className="pb-2 pr-4 font-medium">Buyer</th>
                  <th className="pb-2 pr-4 font-medium">Coupons</th>
                  <th className="pb-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.data.orders.map((order) => (
                  <tr
                    key={order.bookingUid}
                    className="border-b border-border/50 align-top"
                  >
                    <td className="py-2 pr-4 whitespace-nowrap text-muted-foreground">
                      {formatDateTime(order.createdAt)}
                    </td>
                    <td className="py-2 pr-4">
                      <div>{order.user?.name ?? "—"}</div>
                      <div className="text-xs text-muted-foreground">
                        {order.user?.email}
                        {order.user?.phone ? ` · ${order.user.phone}` : ""}
                      </div>
                    </td>
                    <td className="py-2 pr-4 text-muted-foreground">
                      {order.items
                        .map(
                          (item) =>
                            `Day ${item.day} ${dietName(item.diet)} × ${item.quantity}`,
                        )
                        .join(", ")}
                    </td>
                    <td className="py-2">
                      <Badge tone={STATUS_TONE[order.status] ?? "neutral"}>
                        {order.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
