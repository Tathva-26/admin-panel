import type {
  Booking,
  BookingQuery,
  BookingStatusInput,
  ListResponse,
} from "@/types";

import { get, patch } from "./client";
import { listUsers } from "./users";

const BASE = "/admin/bookings";

/** Bookings are addressed by `bookingUid`, not a numeric id. */
export const listBookings = (query: BookingQuery = {}) =>
  get<ListResponse<Booking>>(BASE, query);

/** Cap on name matches expanded into booking queries; each one is a request. */
const MAX_NAME_MATCHES = 10;

/**
 * Bookings search, including user names.
 *
 * The endpoint matches only `bookingUid` and `user.email`, never `user.name`,
 * despite the table showing a name column. `GET /admin/users?search=` does match
 * names and bookings accepts `userId`, so names are resolved to users first and
 * their bookings merged in.
 *
 * Collapses back to `listBookings` once the backend searches `user.name`.
 */
export async function searchBookings(
  query: BookingQuery = {},
): Promise<ListResponse<Booking>> {
  const term = query.search?.trim();
  if (!term) return listBookings(query);

  const { page = 1, pageSize = 20, ...rest } = query;

  const [direct, users] = await Promise.all([
    // Unpaginated within the window so the merge sees everything it should.
    listBookings({ ...rest, search: term, page: 1, pageSize: 100 }),
    listUsers({ search: term, pageSize: MAX_NAME_MATCHES }).catch(() => null),
  ]);

  const byName = users?.items ?? [];
  const extra = await Promise.all(
    byName.map((user) =>
      listBookings({ ...rest, userId: user.id, page: 1, pageSize: 100 })
        .then((res) => res.items)
        .catch(() => [] as Booking[]),
    ),
  );

  const merged = new Map<string, Booking>();
  for (const booking of [...direct.items, ...extra.flat()]) {
    merged.set(booking.bookingUid, booking);
  }

  const items = [...merged.values()];

  // The server already ordered each response; re-apply it across the union so
  // the combined list is not in arbitrary map-insertion order.
  const sortKey = query.sort === "amountTotal" ? "amountTotal" : "createdAt";
  const direction = query.order === "asc" ? 1 : -1;
  items.sort((a, b) => {
    const left = sortKey === "amountTotal" ? a.amountTotal : a.createdAt;
    const right = sortKey === "amountTotal" ? b.amountTotal : b.createdAt;
    if (left === right) return 0;
    return left > right ? direction : -direction;
  });

  const start = (page - 1) * pageSize;

  return {
    items: items.slice(start, start + pageSize),
    page,
    pageSize,
    total: items.length,
  };
}

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
