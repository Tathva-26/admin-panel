"use client";

import { useState } from "react";

import { BookingStatusBadge } from "@/components/common/StatusBadge";
import Button from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import { Select } from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import { useMutation } from "@/hooks/useMutation";
import { useNow } from "@/hooks/useNow";
import { updateBookingStatus } from "@/lib/api/bookings";
import {
  effectiveBookingStatus,
  formatDateTime,
  formatInr,
} from "@/lib/format";
import { bookingKindLabel, bookingStatusLabel } from "@/lib/labels";

import AccommodationPanel from "./AccommodationPanel";
import {
  BOOKING_TRANSITIONS,
  type Booking,
  type BookingStatus,
} from "@/types";

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
  // `displayStatus` is what the customer sees (PENDING becomes TIMEOUT once the
  // window lapses); `booking.status` is the stored column the backend validates
  // transitions against. Badge shows the former, options come from the latter.
  const displayStatus = effectiveBookingStatus(booking, useNow());
  const allowed = BOOKING_TRANSITIONS[booking.status] ?? [];

  const [status, setStatus] = useState<BookingStatus | "">("");
  const update = useMutation((uid: string, next: BookingStatus) =>
    updateBookingStatus(uid, { status: next }),
  );

  async function submit() {
    if (!status) return;
    const updated = await update.run(booking.bookingUid, status);
    if (updated) onSaved();
  }

  return (
    <Modal
      open
      onClose={update.loading ? () => {} : onClose}
      title="Booking"
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
            disabled={!status}
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
              {booking.user?.name ?? "—"}
            </dd>

            <dt className="text-muted-foreground">Kind</dt>
            <dd className="text-right text-foreground">
              {bookingKindLabel(booking.kind)}
            </dd>

            <dt className="text-muted-foreground">Event</dt>
            <dd className="truncate text-right text-foreground">
              {booking.event?.heading ?? "—"}
            </dd>

            <dt className="text-muted-foreground">Amount</dt>
            <dd className="numeric text-right text-foreground">
              {formatInr(booking.amountTotal)}
            </dd>

            {/* When money actually cleared, which is not when the booking was
                made — the gap is the whole reason PENDING exists. */}
            <dt className="text-muted-foreground">Paid at</dt>
            <dd className="numeric text-right text-foreground">
              {booking.paidAt ? formatDateTime(booking.paidAt) : "—"}
            </dd>

            <dt className="text-muted-foreground">Current</dt>
            <dd className="text-right">
              <BookingStatusBadge status={displayStatus} />
            </dd>

            {/* Worth saying out loud when the two disagree, so nobody reads the
                badge as a database value and wonders why it is not in the list. */}
            {displayStatus !== booking.status ? (
              <>
                <dt className="text-muted-foreground">Stored as</dt>
                <dd className="text-right text-foreground">
                  {bookingStatusLabel(booking.status)} — the payment window
                  lapsed
                </dd>
              </>
            ) : null}
          </dl>

          {booking.accommodation ? (
            <AccommodationPanel accommodation={booking.accommodation} />
          ) : null}

          {booking.ticketUrl ? (
            <a
              href={booking.ticketUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-xs text-info underline-offset-2 hover:underline"
            >
              Open ticket
            </a>
          ) : null}

          {/*
            Only the transitions the backend will actually accept. Offering the
            full list meant picking a dead end and learning about it from a 409.
          */}
          {allowed.length > 0 ? (
            <Field
              label="Change status to"
              hint="Only transitions the backend allows from the stored status are listed."
            >
              {(props) => (
                <Select
                  {...props}
                  value={status}
                  onChange={(e) =>
                    setStatus(e.target.value as BookingStatus | "")
                  }
                >
                  <option value="">Leave unchanged</option>
                  {allowed.map((option) => (
                    <option key={option} value={option}>
                      {bookingStatusLabel(option)}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
          ) : (
            <p className="rounded-md border border-border bg-muted px-3 py-2 text-xs text-muted-foreground">
              There are no status changes available from{" "}
              {bookingStatusLabel(booking.status)}.
            </p>
          )}
        </div>
      ) : null}
    </Modal>
  );
}