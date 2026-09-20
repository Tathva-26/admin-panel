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
 *
 * 8000 is the backend's own default (`backend_v2/src/config/env.js`).
 */
export const API_ORIGIN =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

/*
 * Auth is cookie-only: the backend's better-auth session lives in an httpOnly
 * cookie the browser attaches itself (`withCredentials`). There is no
 * Authorization header and no token in JS or localStorage.
 */
export const api = axios.create({
  baseURL: `${API_ORIGIN}/api`,
  headers: { "Content-Type": "application/json" },
  timeout: 15_000,
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window !== "undefined" && error.response?.status === 401) {
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
 * Resource endpoints wrap their payload — `{ "event": { … } }`, `{ "user": … }`
 * — so pass `key` to reach inside. If the key is absent the body is returned
 * as-is, which is what `GET /api/user/` (unwrapped by design) needs.
 *
 * No guessing at alternative keys: a body that happens to carry `data` or
 * `result` alongside the real payload would be unwrapped to the wrong thing,
 * and that failure is invisible until something renders undefined.
 */
function unwrap<T>(data: unknown, key?: string): T {
  if (key && data && typeof data === "object" && key in data) {
    return (data as Record<string, unknown>)[key] as T;
  }

  return data as T;
}

/**
 * Converts the backend's list envelopes to the shape the UI works in.
 *
 * Every list endpoint answers `{ <resource>: [...], pagination: { page, limit,
 * total } }` — except `GET /admin/venues`, which returns `{ venues }` with no
 * pagination at all. Both land here as one `{ items, page, pageSize, total }`.
 */
function normalizeList<T>(data: T): T {
  if (!data || typeof data !== "object") return data;

  const value = data as Record<string, unknown>;
  if (Array.isArray(value.items)) return data;

  const resourceKey = [
    "events",
    "venues",
    "announcements",
    "users",
    "contacts",
  ].find((candidate) => Array.isArray(value[candidate]));

  if (!resourceKey) return data;

  const items = value[resourceKey] as unknown[];
  const pagination = value.pagination as Record<string, unknown> | undefined;

  return {
    items,
    page: Number(pagination?.page ?? 1),
    // The backend calls it `limit`; the UI calls it `pageSize`.
    pageSize: Number(pagination?.limit ?? items.length),
    total: Number(pagination?.total ?? items.length),
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

/**
 * `multipart/form-data` POST, for `POST /api/upload` — the only place a binary
 * enters this API.
 *
 * Content-Type is deliberately unset: the browser has to write it itself so it
 * can add the multipart boundary. Setting it by hand produces a body the
 * server cannot parse.
 */
export async function postForm<T>(
  path: string,
  form: FormData,
  key?: string,
): Promise<T> {
  const res = await api.post(path, form, {
    headers: { "Content-Type": undefined },
    // Images take longer than the 15s JSON default: they are resized and
    // recompressed server-side before R2 sees them.
    timeout: 60_000,
  });
  return unwrap<T>(res.data, key);
}
