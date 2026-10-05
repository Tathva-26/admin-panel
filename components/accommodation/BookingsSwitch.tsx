"use client";

import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { useMutation } from "@/hooks/useMutation";
import { setBookingsOpen } from "@/lib/api/accommodation";

/**
 * Opens or pauses room AND food bookings. While paused the public page shows
 * "Bookings paused" and the backend refuses new bookings outright, so a page
 * left open in someone's browser cannot get round it. Existing bookings and
 * payments already under way are not touched.
 */
export default function BookingsSwitch({
  open,
  onChanged,
}: {
  open: boolean;
  onChanged: () => void;
}) {
  const toggle = useMutation(setBookingsOpen);

  return (
    <Card
      className={
        open
          ? "border-success/40 bg-success/5"
          : "border-warning/40 bg-warning/5"
      }
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">
            Bookings are {open ? "open" : "paused"}
          </p>
          <p className="text-xs text-muted-foreground">
            {open
              ? "Rooms and food coupons can be booked on the site."
              : "The site shows “Bookings paused” and new room and food bookings are refused."}
          </p>
        </div>
        <Button
          size="sm"
          variant={open ? "secondary" : "primary"}
          disabled={toggle.loading}
          onClick={async () => {
            const result = await toggle.run(!open);
            if (result) onChanged();
          }}
        >
          {toggle.loading ? "Saving…" : open ? "Pause bookings" : "Open bookings"}
        </Button>
      </div>
      {toggle.error ? (
        <p className="mt-2 text-xs text-red-400">{toggle.error.message}</p>
      ) : null}
    </Card>
  );
}
