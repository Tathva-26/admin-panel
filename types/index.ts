/**
 * Shared types for the Tathva admin API.
 *
 * These mirror `backend_v2/API.md` — §8 for the admin surface and §10 for the
 * data models. Two conventions there are easy to get wrong and expensive to get
 * wrong quietly:
 *
 *   - `price` is an integer number of **rupees**, not paise. The backend
 *     converts to paise itself when it pushes the event to TIQR.
 *   - dates go over the wire as ISO 8601 strings, but admins think in IST.
 *
 * Bookings are deliberately absent. TIQR is the system of record for them and
 * this backend stores none, so there is no `/admin/bookings` to model.
 */

/* ------------------------------------------------------------------ */
/* Envelopes                                                           */
/* ------------------------------------------------------------------ */

/**
 * Shape the UI works in. The backend sends `{ <resource>: [...], pagination:
 * { page, limit, total } }`; `lib/api/client.ts` normalises it to this.
 */
export interface ListResponse<T> {
  items: T[]
  page: number
  pageSize: number
  total: number
}

/** One field-level validation failure, flattened from a Zod issue. */
export interface ApiIssue {
  path: string
  message: string
}

/**
 * Error bodies are inconsistent by design (API.md §3): older routes use
 * `message`, newer ones use `error`, and a Zod failure puts an **array** of
 * issues in `error`. `lib/api/errors.ts` is the only place that reads this.
 */
export interface ApiErrorBody {
  error?: string | ApiIssue[] | unknown[]
  message?: string
  /** Only some routes send one, e.g. `VENUE_HAS_EVENTS`. */
  code?: string
  /** TIQR's own response, passed through on booking/sync failures. */
  detail?: unknown
}

/**
 * Query params common to every list endpoint.
 *
 * Query types are `type` aliases rather than interfaces on purpose: only
 * aliases get an implicit index signature, which is what lets them be passed
 * straight to the client's `QueryParams`.
 *
 * `sort`/`order` are client-side only — no admin list endpoint accepts them —
 * but they still ride in the URL so a sorted view survives a reload.
 */
export const ORDERS = ['asc', 'desc'] as const

export type SortOrder = (typeof ORDERS)[number]

export type ListQuery = {
  page?: number
  pageSize?: number
  search?: string
  sort?: string
  order?: SortOrder
}

/* ------------------------------------------------------------------ */
/* Events                                                              */
/* ------------------------------------------------------------------ */

/**
 * `type` is free text on the backend, lowercased on write and mapped to TIQR's
 * genre vocabulary at sync time. These are the values the public site filters
 * on, so they are what the form offers — but an event may carry any string.
 */
export const EVENT_TYPES = [
  'workshops',
  'lectures',
  'competitions',
  'general',
] as const

export type EventType = (typeof EVENT_TYPES)[number]

/** Venue as embedded in an event response. */
export interface EventVenue {
  id: number
  name: string
  location: string | null
  locId?: number | null
}

export interface AdminEvent {
  id: number
  /** TIQR's event id. Null until a successful publish/sync. */
  tiqrEventId: number | null
  /** TIQR's ticket id. `0` means not synced, so not bookable. */
  ticketId: number
  type: string
  heading: string
  datetime: string
  startTime: string | null
  endTime: string | null
  /** Integer **rupees**. */
  price: number
  venueId: number | null
  venue: EventVenue | null
  description: string | null
  catchyPara: string | null
  picture: string | null
  teamSize: number | null
  isTeamEvent: boolean
  committee: string | null
  /** Local bookkeeping only — never updated from TIQR. */
  ticketsRemaining: number
  /** Local bookkeeping only — never updated from TIQR. */
  isFull: boolean
  dynamicPricing: boolean
  published: boolean
  archived: boolean
  createdAt: string
  updatedAt: string
}

/** Body for `POST /admin/events` and (partially) `PATCH /admin/events/:id`. */
export interface EventInput {
  type: string
  heading: string
  /** ISO 8601. Required on create. */
  datetime: string | null
  startTime?: string | null
  endTime?: string | null
  /** Integer **rupees**. Required on create. */
  price: number
  venueId?: number | null
  description?: string | null
  catchyPara?: string | null
  /** Must be an `http(s)` URL — get one from `POST /api/upload`. */
  picture?: string | null
  teamSize?: number | null
  isTeamEvent?: boolean
  committee?: string | null
  ticketsRemaining?: number
  isFull?: boolean
  dynamicPricing?: boolean
}

export type EventQuery = ListQuery & {
  type?: EventType
  published?: boolean
  archived?: boolean
}

/**
 * Outcome of the best-effort TIQR push that `POST /admin/events/:id/publish`
 * performs. Absent when nothing was attempted (unpublish, or already synced).
 *
 * A published event with `ok: false` is live on the public site but unbookable
 * — every booking attempt 409s — so this has to be surfaced, not swallowed.
 */
export type TiqrSync =
  | {
      ok: true
      status?: string
      steps?: string[]
    }
  | {
      ok: false
      error: string
      detail?: unknown
    }

/** `POST /admin/events/:id/publish` — the event plus the sync outcome. */
export interface PublishResult {
  event: AdminEvent
  tiqrSync?: TiqrSync
}

/* ------------------------------------------------------------------ */
/* Venues                                                              */
/* ------------------------------------------------------------------ */

export interface Venue {
  id: number
  name: string
  location: string | null
  locId: number | null
}

export interface VenueInput {
  name: string
  location?: string | null
  locId?: number | null
}

/* ------------------------------------------------------------------ */
/* Announcements                                                       */
/* ------------------------------------------------------------------ */

export interface Announcement {
  id: number
  title: string
  content: string
  published: boolean
  createdAt: string
  updatedAt: string
}

export interface AnnouncementInput {
  title: string
  content: string
}

export type AnnouncementQuery = ListQuery & {
  published?: boolean
}

/* ------------------------------------------------------------------ */
/* Users                                                               */
/* ------------------------------------------------------------------ */

export const ROLES = ['USER', 'CA', 'ADMIN'] as const

export type Role = (typeof ROLES)[number]

/**
 * `id` is a `nanoid(10)` string like `V1StGXR8_Z` — not a UUID and not an
 * integer. Anything that builds a user URL must treat it as opaque text.
 */
export interface AdminUser {
  id: string
  name: string
  email: string
  role: Role
  phone: string | null
  college: string | null
  district: string | null
  state: string | null
  branch: string | null
  semester: number | null
  year: number | null
  picture?: string | null
  /** CA only, issued by TIQR. Null for everyone else. */
  referralCode: string | null
  createdAt: string
}

/**
 * `GET /admin/me` selects a narrower set of columns than the user list does —
 * no district, no referral code — so it gets its own type rather than
 * pretending to be an `AdminUser` with fields that are always undefined.
 */
export interface AdminMe {
  id: string
  email: string
  name: string
  role: Role
  phone: string | null
  college: string | null
  picture: string | null
  createdAt: string
}

export type UserQuery = ListQuery & {
  role?: Role
}

export interface RoleInput {
  role: Role
}

/* ------------------------------------------------------------------ */
/* Contact messages                                                    */
/* ------------------------------------------------------------------ */

/**
 * `status` is free text on the backend; new submissions start as `NEW`. These
 * are the values the panel offers, not a closed set the API enforces.
 */
export const CONTACT_STATUSES = ['NEW', 'IN_PROGRESS', 'RESOLVED'] as const

export type ContactStatus = (typeof CONTACT_STATUSES)[number]

export interface Contact {
  id: number
  topic: string
  name: string
  email: string
  phone: string
  query: string
  status: string
  createdAt: string
}

export type ContactQuery = ListQuery & {
  status?: string
}

export interface ContactStatusInput {
  status: string
}

/* ------------------------------------------------------------------ */
/* Uploads                                                             */
/* ------------------------------------------------------------------ */

export const UPLOAD_FOLDERS = [
  'profile',
  'events',
  'venues',
  'announcements',
] as const

export type UploadFolder = (typeof UPLOAD_FOLDERS)[number]

/** `POST /api/upload`. Everything is converted to webp, whatever went in. */
export interface UploadResult {
  message: string
  url: string
  key: string
  contentType: string
  width: number
  height: number
  size: number
}

/* ------------------------------------------------------------------ */
/* Dashboard                                                           */
/* ------------------------------------------------------------------ */

/**
 * Exactly what `GET /admin/dashboard` returns. There are no booking counts —
 * we do not store bookings.
 */
export interface DashboardStats {
  users: number
  events: number
  venues: number
  announcements: number
  contacts: number
  pendingContacts: number
}
