"use client";

import Badge, { type BadgeTone } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import ErrorState from "@/components/ui/ErrorState";
import BookingsSwitch from "@/components/accommodation/BookingsSwitch";
import SyncButton from "@/components/accommodation/SyncButton";
import InlineNumber from "@/components/ui/InlineNumber";
import Spinner from "@/components/ui/Spinner";
import { useApi } from "@/hooks/useApi";
import { useMutation } from "@/hooks/useMutation";
import {
  getAccommodation,
  updateInventory,
  updateRoomRate,
} from "@/lib/api/accommodation";
import type { AccommodationSummary, Gender, RoomAvailability } from "@/types";

const TIER_LABEL: Record<string, string> = {
  dormitory: "Dormitory",
  "sharing-3": "3 Sharing Room",
  "sharing-4": "4 Sharing Room",
};

const tierName = (tier: string) => TIER_LABEL[tier] ?? tier;
const genderName = (gender: Gender) => (gender === "MALE" ? "Male" : "Female");

const STATUS_TONE: Record<string, BadgeTone> = {
  CONFIRMED: "green",
  PENDING: "amber",
  FAILED: "red",
  OVERBOOKED: "red",
};

/** Fest night N as a date: night 1 is 9 Oct. */
const nightDate = (night: number) => `${8 + night} Oct`;

/** Rupee input → paise, or null when it isn't a usable number. */
function toPaise(value: string): number | null {
  const rupees = Number(value);
  if (!Number.isFinite(rupees) || rupees < 0) return null;
  return Math.round(rupees * 100);
}

/**
 * Per-night stock for one tier+gender: free on top, then paid and held.
 *
 * Shown night by night rather than as a single number because that is how
 * the stock actually behaves: a two-night stay from day 1 and another from
 * day 2 both hold a unit on night 2, so one tier can be full midweek and
 * wide open at either end. "Held" is carts still at the payment page; the
 * reconcile job releases them if they are not paid within 30 minutes.
 */
function NightCells({
  row,
  taken,
}: {
  row: RoomAvailability;
  taken: AccommodationSummary["occupancy"][string] | undefined;
}) {
  const nights = Object.keys(row.byNight).sort();

  return (
    <span className="inline-flex gap-1">
      {nights.map((night) => {
        const free = row.byNight[night];
        const paid = taken?.[night]?.CONFIRMED ?? 0;
        const held = taken?.[night]?.PENDING ?? 0;
        const over = taken?.[night]?.OVERBOOKED ?? 0;
        const soldOut = free <= 0;
        return (
          <span
            key={night}
            title={`Night ${night}: ${paid} paid, ${held} held, ${free} free of ${row.total}${
              over ? `, ${over} overbooked (paid on TIQR, no bed)` : ""
            }`}
            className={[
              "inline-flex min-w-[4.5rem] flex-col items-center rounded border px-1.5 py-1 text-xs tabular-nums",
              soldOut
                ? "border-red-500/40 bg-red-500/10 text-red-400"
                : "border-border text-muted-foreground",
            ].join(" ")}
          >
            <span className="text-sm font-medium text-foreground">{free}</span>
            <span className="text-[10px] leading-tight">
              <span className="text-success">{paid} paid</span>
              {held ? <span className="text-warning"> · {held} held</span> : null}
            </span>
            {over ? (
              <span className="text-[10px] font-medium leading-tight text-red-400">
                +{over} overbooked
              </span>
            ) : null}
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

  const busy = inventoryMutation.loading || roomMutation.loading;

  if (summary.loading && !summary.data) return <Spinner className="h-6 w-6" />;
  if (summary.error) {
    return <ErrorState error={summary.error} onRetry={summary.refetch} />;
  }
  if (!summary.data) return null;

  // Defaults keep the tab working against a backend that predates the
  // paid/held breakdown.
  const {
    inventory,
    rooms,
    availability,
    bookingCount,
    bookings = [],
    occupancy = {},
    overbooked = [],
  } = summary.data;

  // A SKU with no TIQR ticket cannot be sold, whatever the price says, so it
  // is called out rather than left looking live.
  const unprovisioned = rooms.filter(
    (row) => !(row.onSale ?? row.tiqrTicketId),
  ).length;

  const commit = async (run: Promise<unknown>) => {
    await run;
    summary.refetch();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="secondary"
          size="sm"
          onClick={summary.refetch}
          disabled={busy}
        >
          Refresh
        </Button>
        <SyncButton onDone={summary.refetch} />
      </div>

      <BookingsSwitch
        open={summary.data.bookingsOpen ?? true}
        onChanged={summary.refetch}
      />

      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
        <span>{bookingCount} booking(s)</span>
        {bookings.map((row) => (
          <span key={row.status} className="inline-flex items-center gap-1.5">
            <span aria-hidden>·</span>
            <Badge tone={STATUS_TONE[row.status] ?? "neutral"}>{row.status}</Badge>
            {row.count}
          </span>
        ))}
        <span aria-hidden>·</span>
        <span>Check-in 11:00, check-out 10:00</span>
        <span aria-hidden>·</span>
        <span>Guests bring their own bedsheets</span>
      </div>

      {overbooked.length > 0 ? (
        <Card className="border-red-500/40 bg-red-500/5">
          <h2 className="text-sm font-semibold text-red-400">
            {overbooked.length} overbooked booking
            {overbooked.length === 1 ? "" : "s"}
          </h2>
          <p className="mb-3 mt-1 text-xs text-muted-foreground">
            TIQR took the payment but refused the ticket, so these guests have
            paid and hold no bed. They are not counted in the stock below. Each
            one needs honouring (give them a bed) or refunding from the TIQR
            dashboard.
          </p>
          <ul className="space-y-2 text-sm">
            {overbooked.map((row) => (
              <li
                key={row.bookingUid}
                className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5"
              >
                <span className="font-medium">{row.user?.name ?? "—"}</span>
                <span className="text-xs text-muted-foreground">
                  {[row.user?.email, row.user?.phone].filter(Boolean).join(" · ")}
                </span>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {row.tiqrBookingId ?? row.bookingUid}
                </span>
                <span className="text-xs">
                  {row.rooms
                    .map(
                      (room) =>
                        `${tierName(room.tier)} · ${genderName(room.gender)} · ${room.quantity} · ${nightDate(room.checkInDay)}, ${room.nights} night${room.nights === 1 ? "" : "s"}`,
                    )
                    .join("; ")}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {unprovisioned > 0 ? (
        <Card className="border-amber-500/40 bg-amber-500/5">
          <p className="text-sm text-amber-300">
            {unprovisioned} price{unprovisioned === 1 ? "" : "s"} ha
            {unprovisioned === 1 ? "s" : "ve"} no TIQR ticket yet, so they
            cannot be sold. Run{" "}
            <code className="rounded bg-black/30 px-1">
              provision-stay-events.js --provision
            </code>{" "}
            on the backend.
          </p>
        </Card>
      ) : null}

      {/* Stock and live availability */}
      <Card>
        <h2 className="mb-1 text-sm font-semibold">Stock</h2>
        <p className="mb-4 text-xs text-muted-foreground">
          Totals are per night, in each tier&apos;s own unit. Each box is one
          night (1, 2, 3): the big number is free, under it how many are paid
          and how many are held by carts still at payment. Held units are
          released if not paid within 30 minutes.
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
                      {free ? (
                        <NightCells
                          row={free}
                          taken={occupancy[`${row.tier}|${row.gender}`]}
                        />
                      ) : null}
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
                    {row.onSale ?? row.tiqrTicketId ? (
                      <span className="text-xs tabular-nums text-muted-foreground">
                        {row.stayTickets
                          ? `${row.stayTickets} date${row.stayTickets === 1 ? "" : "s"}`
                          : `#${row.tiqrTicketId}`}
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
    </div>
  );
}
