/**
 * Shared types for the Tathva admin API.
 *
 * These mirror `admin-panel-frontend-api.md`. Where the doc says a response
 * includes a field "at least", that field is required here; fields that only
 * appear in request bodies are marked optional, because the backend is still
 * being written and we should not assert what it returns.
 *
 * Conventions from the contract:
 *   - all dates are ISO 8601 strings, sent and received
 *   - all money is an integer number of paise (49900 === ₹499.00)
 */

/* ------------------------------------------------------------------ */
/* Envelopes                                                           */
/* ------------------------------------------------------------------ */

/** Shape returned by every list endpoint. */
export interface ListResponse<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

/** One field-level validation failure, from `details.issues[]`. */
export interface ApiIssue {
  path: string;
  message: string;
}

/** Shape returned by every error, whatever the status. */
export interface ApiErrorBody {
  message: string;
  code: string;
  details?: {
    issues?: ApiIssue[];
  };
}

/**
 * Query params common to every list endpoint.
 *
 * Query types are `type` aliases rather than interfaces on purpose: only
 * aliases get an implicit index signature, which is what lets them be passed
 * straight to the client's `QueryParams`.
 */
export type ListQuery = {
  page?: number;
  pageSize?: number;
  search?: string;
  sort?: string;
  order?: "asc" | "desc";
};

/* ------------------------------------------------------------------ */
/* Events                                                              */
/* ------------------------------------------------------------------ */

export const EVENT_TYPES = [
  "workshops",
  "lectures",
  "competitions",
  "general",
] as const;

export type EventType = (typeof EVENT_TYPES)[number];

/** Venue as embedded in an event response. */
export interface EventVenue {
  id: number;
  name: string;
  address: string | null;
}

export interface AdminEvent {
  id: number;
  type: EventType;
  heading: string;
  description: string | null;
  picture: string | null;
  datetime: string | null;
  startTime: string | null;
  endTime: string | null;
  /** Integer paise. */
  price: number;
  capacity: number | null;
  isFull: boolean;
  isTeamEvent: boolean;
  teamSize: number | null;
  published: boolean;
  venue: EventVenue | null;
  createdAt: string;
  updatedAt: string;

  // Present in the create/update body and on the public event shape, but not
  // in the doc's guaranteed response fields — treat as possibly absent.
  catchyPara?: string | null;
  committee?: string | null;
  ticketId?: number | null;
}

/** Body for `POST /admin/events` and (partially) `PATCH /admin/events/:id`. */
export interface EventInput {
  type: EventType;
  heading: string;
  description?: string | null;
  catchyPara?: string | null;
  picture?: string | null;
  datetime?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  /** Integer paise. */
  price?: number;
  ticketId?: number | null;
  venueId?: number | null;
  committee?: string | null;
  isTeamEvent?: boolean;
  /** Required by the backend when `isTeamEvent` is true. */
  teamSize?: number | null;
  capacity?: number | null;
  published?: boolean;
}

export type EventQuery = ListQuery & {
  type?: EventType;
  published?: boolean;
};

/* ------------------------------------------------------------------ */
/* Venues                                                              */
/* ------------------------------------------------------------------ */

export interface Venue {
  id: number;
  name: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
}

export interface VenueInput {
  name: string;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

/* ------------------------------------------------------------------ */
/* Announcements                                                       */
/* ------------------------------------------------------------------ */

export interface Announcement {
  id: number;
  title: string;
  content: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AnnouncementInput {
  title: string;
  content: string;
  published?: boolean;
}

export type AnnouncementQuery = ListQuery & {
  published?: boolean;
};

/* ------------------------------------------------------------------ */
/* Users                                                               */
/* ------------------------------------------------------------------ */

export const ROLES = ["USER", "ADMIN"] as const;

export type Role = (typeof ROLES)[number];

/**
 * Note: `googleSub` is deliberately absent. The contract says not to expect or
 * display it, so it is not modelled here.
 */
export interface AdminUser {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  college: string | null;
  district: string | null;
  referral: string;
  role: Role;
  picture?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type UserQuery = ListQuery & {
  role?: Role;
};

export interface RoleInput {
  role: Role;
}

/* ------------------------------------------------------------------ */
/* Bookings                                                            */
/* ------------------------------------------------------------------ */

export const BOOKING_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "FAILED",
  "CANCELLED",
  "TIMEOUT",
] as const;

export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const BOOKING_KINDS = ["EVENT", "ACCOMMODATION"] as const;

export type BookingKind = (typeof BOOKING_KINDS)[number];

export interface BookingUser {
  id: number;
  name: string;
  email: string;
}

export interface BookingEvent {
  id: number;
  heading: string;
  type: EventType;
}

export interface Booking {
  bookingUid: string;
  kind: BookingKind;
  status: BookingStatus;
  qty: number;
  /** All amounts are integer paise. */
  amountSubtotal: number;
  amountFee: number;
  amountTax: number;
  amountTotal: number;
  currency: string;
  user: BookingUser;
  event: BookingEvent | null;
  /** Present on accommodation bookings; shape not modelled until we show it. */
  accommodation: unknown;
  createdAt: string;
  updatedAt: string;
}

export type BookingQuery = ListQuery & {
  status?: BookingStatus;
  kind?: BookingKind;
  eventId?: number;
};

export interface BookingStatusInput {
  status: BookingStatus;
}

/* ------------------------------------------------------------------ */
/* Dashboard                                                           */
/* ------------------------------------------------------------------ */

export interface DashboardStats {
  events: { total: number; published: number; drafts: number };
  announcements: { total: number; published: number };
  users: number;
  bookings: {
    total: number;
    pending: number;
    confirmed: number;
    failed: number;
  };
  contactMessages: { new: number };
}
