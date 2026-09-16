/**
 * The single axios instance every admin API module goes through.
 *
 * Resource modules (`lib/api/events.ts`, `lib/api/venues.ts`, …) should not
 * import axios directly — they call the `get` / `post` / `patch` / `del`
 * helpers below so that base URL, param cleaning and response unwrapping stay
 * in one place.
 */

import axios from "axios";

/**
 * Origin of the backend, without the `/api` prefix — e.g. `http://localhost:5000`.
 * The contract roots every path at `/api`, so that is appended here rather than
 * repeated in every call.
 */
/*
 * Falls back to the local backend rather than "". An empty origin makes every
 * request relative, so with NEXT_PUBLIC_API_URL unset they hit this app's own
 * origin — which serves no /api routes, so the failure arrives as Next's HTML
 * 404 page parsed as an API error instead of a plain "cannot reach the
 * backend". That was survivable while an in-repo mock answered those paths;
 * it no longer exists.
 */
export const API_ORIGIN =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

export const api = axios.create({
  baseURL: `${API_ORIGIN}/api`,
  headers: { "Content-Type": "application/json" },
  timeout: 15_000,
});

/*
 * Auth is out of scope for now (the lead asked us to skip it), but every admin
 * request will eventually need `Authorization: Bearer <token>`. This is the one
 * place that changes when it lands — nothing else should read the token.
 */
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = window.localStorage.getItem("jwt");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window !== "undefined" && error.response?.status === 401) {
      window.localStorage.removeItem("jwt");
      if (window.location.pathname !== "/login") {
        // Hard navigation, as with logout: an expired session must not
        // leave the previous admin's data sitting in memory.
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.href = "/login?error=session_expired";
      }
    }
    return Promise.reject(error);
  },
);

/* ------------------------------------------------------------------ */
/* Request helpers                                                     */
/* ------------------------------------------------------------------ */

/** Values accepted as query-string params. */
export type QueryParams = Record<
  string,
  string | number | boolean | undefined | null
>;

/**
 * Drops empty params so we send `?page=1` rather than `?page=1&type=&search=`.
 * An empty filter should be absent, not blank — the backend treats them
 * differently.
 */
function cleanParams(params?: QueryParams): QueryParams | undefined {
  if (!params) return undefined;

  const cleaned = Object.entries(params)
    .filter(
      ([, value]) => value !== undefined && value !== null && value !== "",
    )
    .map(
      ([key, value]) => [key === "pageSize" ? "limit" : key, value] as const,
    );

  return cleaned.length ? Object.fromEntries(cleaned) : undefined;
}

/**
 * Resource endpoints wrap their payload — `{ "event": { … } }` — while list
 * endpoints return `{ items, page, pageSize, total }` directly. Pass `key` to
 * unwrap the former.
 *
 * If the key is absent from the response the body is returned as-is, so a
 * backend that stops wrapping (or has not started yet) does not crash the UI.
 *
 * Also tries common alternative keys ("data", "result") if the primary key
 * is not found, to handle backends with different wrapping conventions.
 */
function unwrap<T>(data: unknown, key?: string): T {
  if (key && data && typeof data === "object" && key in data) {
    return (data as Record<string, unknown>)[key] as T;
  }

  // Try common alternative wrapping keys
  const altKeys = ["data", "result"];
  for (const altKey of altKeys) {
    if (data && typeof data === "object" && altKey in data) {
      return (data as Record<string, unknown>)[altKey] as T;
    }
  }

  return data as T;
}

/** Converts backend-v2 list envelopes to the shape used by the UI. */
function normalizeList<T>(data: T): T {
  if (!data || typeof data !== "object") return data;

  const value = data as Record<string, unknown>;
  if (Array.isArray(value.items)) return data;

  const resourceKey = [
    "events",
    "venues",
    "announcements",
    "users",
    "bookings",
    "contacts",
  ].find((candidate) => Array.isArray(value[candidate]));

  if (!resourceKey) return data;

  const items = value[resourceKey] as unknown[];
  const normalizedItems =
    resourceKey === "bookings"
      ? items.map((item) => {
          const booking = item as Record<string, unknown>;
          const user = (booking.user ?? {}) as Record<string, unknown>;
          const event = (booking.event ?? null) as Record<
            string,
            unknown
          > | null;
          const amount = Number(booking.amountTotal ?? 0);

          return {
            ...booking,
            kind: booking.kind ?? (booking.eventId ? "EVENT" : "ACCOMMODATION"),
            qty: booking.qty ?? booking.quantity ?? 1,
            amountSubtotal: Number(booking.amountSubtotal ?? 0),
            amountFee: Number(booking.amountFee ?? 0),
            amountTax: Number(booking.amountTax ?? 0),
            amountTotal: amount,
            currency: booking.currency ?? "INR",
            user: {
              id: user.id ?? 0,
              name: user.name ?? "Unknown user",
              email: user.email ?? "",
            },
            event: event
              ? {
                  id: event.id,
                  heading: event.heading,
                  type: event.type,
                }
              : null,
            accommodation: booking.accommodation ?? null,
          };
        })
      : items;
  const pagination = value.pagination as Record<string, unknown> | undefined;
  const page = Number(pagination?.page ?? 1);
  const pageSize = Number(pagination?.limit ?? items.length);
  const total = Number(pagination?.total ?? items.length);

  return {
    items: normalizedItems,
    page,
    pageSize,
    total,
  } as T;
}

export async function get<T>(
  path: string,
  params?: QueryParams,
  key?: string,
): Promise<T> {
  const res = await api.get(path, { params: cleanParams(params) });
  return normalizeList(unwrap<T>(res.data, key));
}

export async function post<T>(
  path: string,
  body?: unknown,
  key?: string,
): Promise<T> {
  const res = await api.post(path, body ?? {});
  return unwrap<T>(res.data, key);
}

export async function patch<T>(
  path: string,
  body?: unknown,
  key?: string,
): Promise<T> {
  const res = await api.patch(path, body ?? {});
  return unwrap<T>(res.data, key);
}

/**
 * `DELETE` is an archive operation in this API, not a guaranteed physical
 * delete. Callers should refetch rather than assume the row is gone forever.
 */
export async function del(path: string): Promise<void> {
  await api.delete(path);
}
