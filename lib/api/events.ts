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

function eventBody(body: Partial<EventInput>, image?: File | null) {
  // Optional ticket IDs must be omitted, not sent as null to Prisma's Int.
  const data = { ...body };
  if (data.ticketId == null) delete data.ticketId;
  if (!image) return data;
  const multipart = new FormData();
  multipart.append("data", JSON.stringify(data));
  multipart.append("image", image);
  return multipart;
}

export const createEvent = (body: EventInput, image?: File | null) =>
  post<AdminEvent>(BASE, eventBody(body, image), "event");

export const updateEvent = (id: number, body: Partial<EventInput>, image?: File | null) =>
  patch<AdminEvent>(`${BASE}/${id}`, eventBody(body, image), "event");

export const publishEvent = (id: number) =>
  post<AdminEvent>(`${BASE}/${id}/publish`, {}, "event");

export const unpublishEvent = (id: number) =>
  post<AdminEvent>(`${BASE}/${id}/unpublish`, {}, "event");

/** Archive, not a guaranteed physical delete — refetch rather than assume. */
export const archiveEvent = (id: number) => del(`${BASE}/${id}`);
