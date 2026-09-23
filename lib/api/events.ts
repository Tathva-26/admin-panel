import type {
  AdminEvent,
  EventInput,
  EventQuery,
  ListResponse,
  TiqrSyncResult,
} from "@/types";

import { get, patchFull, post } from "./client";

/** Response shape for endpoints that also push the change to TIQR when the event is synced there. */
export interface EventSyncedMutationResult {
  message: string;
  event: AdminEvent;
  tiqrSync?: TiqrSyncResult;
}

const BASE = "/admin/events";

export const listEvents = (query: EventQuery = {}) =>
  get<ListResponse<AdminEvent>>(BASE, query);

export const getEvent = (id: number) =>
  get<AdminEvent>(`${BASE}/${id}`, undefined, "event");

/**
 * `ticketId` is an Int with no null allowed, so a null is left out. `picture`
 * is never sent: the backend takes images only as an `image` file.
 */
function toRequestBody<T extends { ticketId?: number | null; picture?: string | null }>(
  body: T,
) {
  const { ticketId, picture: _picture, ...rest } = body;
  return ticketId === null ? rest : { ...rest, ticketId };
}

/**
 * JSON without an image, multipart with one. Multipart cannot carry null, so
 * those fields are left out.
 */
function withImage(body: object, image?: File | null) {
  if (!image) return body;

  const form = new FormData();
  for (const [key, value] of Object.entries(body)) {
    if (value !== null && value !== undefined) form.append(key, String(value));
  }
  form.append("image", image);
  return form;
}

export const createEvent = (body: EventInput, image?: File | null) =>
  post<AdminEvent>(BASE, withImage(toRequestBody(body), image), "event");

export const updateEvent = (
  id: number,
  body: Partial<EventInput>,
  image?: File | null,
) =>
  patchFull<EventSyncedMutationResult>(
    `${BASE}/${id}`,
    withImage(toRequestBody(body), image),
  );

export const publishEvent = (id: number) =>
  post<AdminEvent>(`${BASE}/${id}/publish`, {}, "event");

export const unpublishEvent = (id: number) =>
  post<AdminEvent>(`${BASE}/${id}/unpublish`, {}, "event");
