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
const API_ORIGIN = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

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

  const cleaned = Object.entries(params).filter(
    ([, value]) => value !== undefined && value !== null && value !== "",
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
 */
function unwrap<T>(data: unknown, key?: string): T {
  if (key && data && typeof data === "object" && key in data) {
    return (data as Record<string, unknown>)[key] as T;
  }
  return data as T;
}

export async function get<T>(
  path: string,
  params?: QueryParams,
  key?: string,
): Promise<T> {
  const res = await api.get(path, { params: cleanParams(params) });
  return unwrap<T>(res.data, key);
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
