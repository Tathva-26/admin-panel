import type {
  AdminEvent,
  EventInput,
  EventQuery,
  ListResponse,
} from "@/types";

import { del, get, patch, post } from "./client";

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
  patch<AdminEvent>(`${BASE}/${id}`, withImage(toRequestBody(body), image), "event");

export const publishEvent = (id: number) =>
  post<AdminEvent>(`${BASE}/${id}/publish`, {}, "event");

export const unpublishEvent = (id: number) =>
  post<AdminEvent>(`${BASE}/${id}/unpublish`, {}, "event");

/** Archive, not a guaranteed physical delete — refetch rather than assume. */
export const archiveEvent = (id: number) => del(`${BASE}/${id}`);
