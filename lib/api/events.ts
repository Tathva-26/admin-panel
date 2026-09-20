import type {
  AdminEvent,
  EventInput,
  EventQuery,
  ListResponse,
  PublishResult,
} from "@/types";

import { del, get, patch, post } from "./client";

const BASE = "/admin/events";

export const listEvents = (query: EventQuery = {}) =>
  get<ListResponse<AdminEvent>>(BASE, query);

export const getEvent = (id: number) =>
  get<AdminEvent>(`${BASE}/${id}`, undefined, "event");

export const createEvent = (body: EventInput) =>
  post<AdminEvent>(BASE, body, "event");

export const updateEvent = (id: number, body: Partial<EventInput>) =>
  patch<AdminEvent>(`${BASE}/${id}`, body, "event");

/**
 * Publishing is also what pushes the event to TIQR and creates the ticket that
 * makes it bookable — so the whole body comes back, not just the event.
 *
 * The push is best-effort: a TIQR failure still publishes locally and reports
 * `tiqrSync.ok === false`. That event is live on the public site and
 * unbookable, so the caller must show it and offer `syncEvent` as a retry.
 */
export const publishEvent = (id: number) =>
  post<PublishResult>(`${BASE}/${id}/publish`, {});

/** No TIQR call — unpublishing is local only, and never returns a `tiqrSync`. */
export const unpublishEvent = (id: number) =>
  post<AdminEvent>(`${BASE}/${id}/unpublish`, {}, "event");

/**
 * Retries the TIQR push on its own. Idempotent, and resumes a partial sync, so
 * it is safe to click twice.
 */
export const syncEvent = (id: number) =>
  post<{ status: string; steps?: string[] }>(`${BASE}/${id}/sync`, {});

/** Archive, not a physical delete — refetch rather than assume the row is gone. */
export const archiveEvent = (id: number) => del(`${BASE}/${id}`);
