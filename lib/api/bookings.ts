import type {
  Booking,
  BookingQuery,
  BookingStatusInput,
  ListResponse,
} from "@/types";

import { get, patch } from "./client";

const BASE = "/admin/bookings";

/**
 * Bookings are addressed by `bookingUid`, not a numeric id.
 *
 * `search` matches the booking id, the user's email and the user's name.
 */
export const listBookings = (query: BookingQuery = {}) =>
  get<ListResponse<Booking>>(BASE, query);

export const getBooking = (bookingUid: string) =>
  get<Booking>(`${BASE}/${bookingUid}`, undefined, "booking");

/**
 * The backend owns payment truth and rejects invalid transitions with
 * `409 INVALID_BOOKING_TRANSITION`. This never assumes a change is allowed —
 * it asks, and reports what comes back.
 */
export const updateBookingStatus = (
  bookingUid: string,
  body: BookingStatusInput,
) => patch<Booking>(`${BASE}/${bookingUid}/status`, body, "booking");
