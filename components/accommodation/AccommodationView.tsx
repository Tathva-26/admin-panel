"use client";

import { useState, type ChangeEvent } from "react";

import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import ErrorState from "@/components/ui/ErrorState";
import { Input } from "@/components/ui/Input";
import Spinner from "@/components/ui/Spinner";
import { useApi } from "@/hooks/useApi";
import { useMutation } from "@/hooks/useMutation";
import {
  getAccommodation,
  updateFoodRate,
  updateInventory,
  updateRoomRate,
} from "@/lib/api/accommodation";
import type { Diet, Gender, RoomAvailability } from "@/types";

const TIER_LABEL: Record<string, string> = {
  dormitory: "Dormitory",
  "sharing-3": "3 Sharing Room",
  "sharing-4": "4 Sharing Room",
};

const tierName = (tier: string) => TIER_LABEL[tier] ?? tier;
const genderName = (gender: Gender) => (gender === "MALE" ? "Male" : "Female");
const dietName = (diet: Diet) => (diet === "VEG" ? "Veg" : "Non-Veg");

/** Rupee input → paise, or null when it isn't a usable number. */
function toPaise(value: string): number | null {
  const rupees = Number(value);
  if (!Number.isFinite(rupees) || rupees < 0) return null;
  return Math.round(rupees * 100);
}

/**
 * An editable number that only submits on an actual change, so tabbing
 * through the table does not fire a write per cell.
 */
function InlineNumber({
  initial,
  suffix,
  disabled,
  onCommit,
}: {
  initial: string;
  suffix?: string;
  disabled?: boolean;
  onCommit: (value: string) => void;
}) {
  const [value, setValue] = useState(initial);

  return (
    <span className="inline-flex items-center gap-1">
      <Input
        value={value}
        disabled={disabled}
        onChange={(event: ChangeEvent<HTMLInputElement>) => setValue(event.target.value)}
        onBlur={() => {
          if (value !== initial) onCommit(value);
        }}
        className="h-8 w-24 text-right"
      />
      {suffix ? <span className="text-xs text-muted-foreground">{suffix}</span> : null}
    </span>
  );
}

/**
 * Per-night free counts for one tier+gender.
 *
 * Shown night by night rather than as a single number because that is how
 * the stock actually behaves: a two-night stay from day 1 and another from
 * day 2 both hold a unit on night 2, so one tier can be full midweek and
 * wide open at either end.
 */
function NightCells({ row }: { row: RoomAvailability }) {
  const nights = Object.keys(row.byNight).sort();

  return (
    <span className="inline-flex gap-1">
      {nights.map((night) => {
        const free = row.byNight[night];
        const soldOut = free <= 0;
        return (
          <span
            key={night}
            title={`Night ${night}: ${free} of ${row.total} free`}
            className={[
              "inline-flex min-w-[3.25rem] items-center justify-center rounded border px-1.5 py-0.5 text-xs tabular-nums",
              soldOut
                ? "border-red-500/40 bg-red-500/10 text-red-400"
                : "border-border text-muted-foreground",
            ].join(" ")}
          >
            {free}
          </span>
        );
      })}
    </span>
  );
}

export default function AccommodationView() {
  const summary = useApi("accommodation", getAccommodation);

  const inventoryMutation = useMutation(updateInventory);
  const roomMutation = useMutation(updateRoomRate);
  const foodMutation = useMutation(updateFoodRate);

  const busy =
    inventoryMutation.loading || roomMutation.loading || foodMutation.loading;

  if (summary.loading && !summary.data) return <Spinner className="h-6 w-6" />;
  if (summary.error) {
    return <ErrorState error={summary.error} onRetry={summary.refetch} />;
  }
  if (!summary.data) return null;

  const { inventory, rooms, food, availability, bookingCount, kitchen } =
    summary.data;

  // A SKU with no TIQR ticket cannot be sold, whatever the price says, so it
  // is called out rather than left looking live.
  const unprovisioned =
    rooms.filter((row) => !row.tiqrTicketId).length +
    food.filter((row) => !row.tiqrTicketId).length;

  const commit = async (run: Promise<unknown>) => {
    await run;
    summary.refetch();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
        <span>{bookingCount} booking(s)</span>
        <span aria-hidden>·</span>
        <span>Check-in 11:00, check-out 10:00</span>
        <span aria-hidden>·</span>
        <span>Guests bring their own bedsheets</span>
      </div>

      {unprovisioned > 0 ? (
        <Card className="border-amber-500/40 bg-amber-500/5">
          <p className="text-sm text-amber-300">
            {unprovisioned} price{unprovisioned === 1 ? "" : "s"} ha
            {unprovisioned === 1 ? "s" : "ve"} no TIQR ticket yet, so they
            cannot be sold. Run{" "}
            <code className="rounded bg-black/30 px-1">
              provision-accommodation.js --provision
            </code>{" "}
            on the backend.
          </p>
        </Card>
      ) : null}

      {/* Stock and live availability */}
      <Card>
        <h2 className="mb-1 text-sm font-semibold">Stock</h2>
        <p className="mb-4 text-xs text-muted-foreground">
          Totals are per night, in each tier&apos;s own unit. The three boxes
          are how many are still free on nights 1, 2 and 3.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="pb-2 pr-4 font-medium">Tier</th>
                <th className="pb-2 pr-4 font-medium">Gender</th>
                <th className="pb-2 pr-4 font-medium">Total</th>
                <th className="pb-2 font-medium">Free by night</th>
              </tr>
            </thead>
            <tbody>
              {inventory.map((row) => {
                const free = availability.find(
                  (item) => item.tier === row.tier && item.gender === row.gender,
                );
                return (
                  <tr key={row.id} className="border-b border-border/50">
                    <td className="py-2 pr-4">{tierName(row.tier)}</td>
                    <td className="py-2 pr-4 text-muted-foreground">
                      {genderName(row.gender)}
                    </td>
                    <td className="py-2 pr-4">
                      <InlineNumber
                        initial={String(row.total)}
                        suffix={row.unit + (row.total === 1 ? "" : "s")}
                        disabled={busy}
                        onCommit={(value) => {
                          const total = Number(value);
                          if (!Number.isInteger(total) || total < 0) return;
                          void commit(inventoryMutation.run(row.id, total));
                        }}
                      />
                    </td>
                    <td className="py-2">
                      {free ? <NightCells row={free} /> : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {inventoryMutation.error ? (
          <p className="mt-3 text-xs text-red-400">
            {inventoryMutation.error.message}
          </p>
        ) : null}
      </Card>

      {/* Room pricing */}
      <Card>
        <h2 className="mb-1 text-sm font-semibold">Room prices</h2>
        <p className="mb-4 text-xs text-muted-foreground">
          Per whole stay, not per night. Saving also reprices the ticket on TIQR;
          if that fails nothing is saved here either.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="pb-2 pr-4 font-medium">Tier</th>
                <th className="pb-2 pr-4 font-medium">Gender</th>
                <th className="pb-2 pr-4 font-medium">Nights</th>
                <th className="pb-2 pr-4 font-medium">Price (₹)</th>
                <th className="pb-2 font-medium">TIQR</th>
              </tr>
            </thead>
            <tbody>
              {rooms.map((row) => (
                <tr key={row.id} className="border-b border-border/50">
                  <td className="py-2 pr-4">{tierName(row.tier)}</td>
                  <td className="py-2 pr-4 text-muted-foreground">
                    {genderName(row.gender)}
                  </td>
                  <td className="py-2 pr-4 tabular-nums">{row.nights}</td>
                  <td className="py-2 pr-4">
                    <InlineNumber
                      initial={String(row.price / 100)}
                      disabled={busy}
                      onCommit={(value) => {
                        const paise = toPaise(value);
                        if (paise === null || paise === row.price) return;
                        void commit(roomMutation.run(row.id, paise));
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

        {roomMutation.error ? (
          <p className="mt-3 text-xs text-red-400">
            {roomMutation.error.message}
          </p>
        ) : null}
      </Card>

      {/* Food */}
      <Card>
        <h2 className="mb-1 text-sm font-semibold">Food coupons</h2>
        <p className="mb-4 text-xs text-muted-foreground">
          One coupon covers breakfast and lunch for its day.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="pb-2 pr-4 font-medium">Day</th>
                <th className="pb-2 pr-4 font-medium">Diet</th>
                <th className="pb-2 pr-4 font-medium">Price (₹)</th>
                <th className="pb-2 pr-4 font-medium">Sold</th>
                <th className="pb-2 font-medium">TIQR</th>
              </tr>
            </thead>
            <tbody>
              {food.map((row) => {
                const sold =
                  kitchen.find(
                    (item) => item.day === row.day && item.diet === row.diet,
                  )?.quantity ?? 0;
                return (
                  <tr key={row.id} className="border-b border-border/50">
                    <td className="py-2 pr-4">Day {row.day}</td>
                    <td className="py-2 pr-4 text-muted-foreground">
                      {dietName(row.diet)}
                    </td>
                    <td className="py-2 pr-4">
                      <InlineNumber
                        initial={String(row.price / 100)}
                        disabled={busy}
                        onCommit={(value) => {
                          const paise = toPaise(value);
                          if (paise === null || paise === row.price) return;
                          void commit(foodMutation.run(row.id, paise));
                        }}
                      />
                    </td>
                    <td className="py-2 pr-4 tabular-nums">{sold}</td>
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
                );
              })}
            </tbody>
          </table>
        </div>

        {/* What catering has to cook. */}
        <p className="mt-4 text-xs text-muted-foreground">
          Kitchen totals:{" "}
          {kitchen.length === 0
            ? "nothing booked yet"
            : kitchen
                .map(
                  (row) =>
                    `Day ${row.day} ${dietName(row.diet)} × ${row.quantity}`,
                )
                .join(" · ")}
        </p>

        {foodMutation.error ? (
          <p className="mt-3 text-xs text-red-400">
            {foodMutation.error.message}
          </p>
        ) : null}
      </Card>

      <div>
        <Button
          variant="secondary"
          size="sm"
          onClick={summary.refetch}
          disabled={busy}
        >
          Refresh
        </Button>
      </div>
    </div>
  );
}
