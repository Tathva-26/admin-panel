"use client";

import { useState } from "react";

import { BookingStatusBadge } from "@/components/common/StatusBadge";
import Button from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import { Select } from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import { useMutation } from "@/hooks/useMutation";
import { updateBookingStatus } from "@/lib/api/bookings";
import { formatInr } from "@/lib/format";
import { bookingStatusLabel } from "@/lib/labels";
import { BOOKING_STATUSES, type Booking, type BookingStatus } from "@/types";

/**
 * Mounted only while a booking is selected, and keyed by uid in the parent, so
 * the picker resets by remounting rather than by syncing state in an effect.
 */
interface BookingStatusModalProps {
  booking: Booking;
  onClose: () => void;
  onSaved: () => void;
}

/**
 * Deliberately a status picker rather than a "Confirm payment" button.
 *
 * The contract is explicit that the backend owns payment truth and may reject a
 * transition with 409 INVALID_BOOKING_TRANSITION. A one-click confirm would
 * imply this panel can decide that; it cannot.
 */
export default function BookingStatusModal({
  booking,
  onClose,
  onSaved,
}: BookingStatusModalProps) {
  const [status, setStatus] = useState<BookingStatus>(booking.status);
  const update = useMutation((uid: string, next: BookingStatus) =>
    updateBookingStatus(uid, { status: next }),
  );


  async function submit() {
    const updated = await update.run(booking.bookingUid, status);
    if (updated) onSaved();
  }

  return (
    <Modal
      open
      onClose={update.loading ? () => {} : onClose}
      title="Change booking status"
      description={booking.bookingUid}
      footer={
        <>
          <Button size="sm" onClick={onClose} disabled={update.loading}>
            Cancel
          </Button>
          <Button
            size="sm"
            variant="primary"
            loading={update.loading}
            disabled={booking.status === status}
            onClick={submit}
          >
            Update status
          </Button>
        </>
      }
    >
      {booking ? (
        <div className="space-y-3">
          {update.error ? (
            <p className="rounded-md border border-destructive bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {update.error.message}
            </p>
          ) : null}

          <dl className="grid grid-cols-2 gap-y-2 rounded-md border border-border bg-muted px-3 py-2.5 text-sm">
            <dt className="text-muted-foreground">Booked by</dt>
            <dd className="truncate text-right text-foreground">
              {booking.user.name}
            </dd>

            <dt className="text-muted-foreground">Event</dt>
            <dd className="truncate text-right text-foreground">
              {booking.event?.heading ?? "—"}
            </dd>

            <dt className="text-muted-foreground">Amount</dt>
            <dd className="numeric text-right text-foreground">
              {formatInr(booking.amountTotal)}
            </dd>

            <dt className="text-muted-foreground">Current</dt>
            <dd className="text-right">
              <BookingStatusBadge status={booking.status} />
            </dd>
          </dl>

          <Field
            label="New status"
            hint="The backend verifies payment state and may reject the change."
          >
            {(props) => (
              <Select
                {...props}
                value={status}
                onChange={(e) => setStatus(e.target.value as BookingStatus)}
              >
                {BOOKING_STATUSES.map((option) => (
                  <option key={option} value={option}>
                    {bookingStatusLabel(option)}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        </div>
      ) : null}
    </Modal>
  );
}
