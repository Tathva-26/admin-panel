import type {
  AdminEvent,
  EventInput,
  EventQuery,
  ListResponse,
  TiqrSyncResult,
} from "@/types";

import { del, get, patchFull, post } from "./client";

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

/** DRAFT -> OPEN. Pushes the event to TIQR first; TIQR has no delete, so this is one-way. */
export const openBooking = (id: number) =>
  post<EventSyncedMutationResult>(`${BASE}/${id}/open-booking`, {});

/** OPEN -> CLOSED. Local only: TIQR stops selling on its own once its capacity is full. */
export const closeBooking = (id: number) =>
  post<EventSyncedMutationResult>(`${BASE}/${id}/close-booking`, {});

/**
 * Permanent delete. Only allowed for a DRAFT that was never synced to TIQR;
 * the backend answers 409 (EVENT_NOT_DRAFT / EVENT_SYNCED) otherwise.
 */
export const deleteEvent = (id: number) =>
  del<{ message: string }>(`${BASE}/${id}`);
