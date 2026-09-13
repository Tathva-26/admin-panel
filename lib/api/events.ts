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

export const createEvent = (body: EventInput) =>
  post<AdminEvent>(BASE, body, "event");

export const updateEvent = (id: number, body: Partial<EventInput>) =>
  patch<AdminEvent>(`${BASE}/${id}`, body, "event");

export const publishEvent = (id: number) =>
  post<AdminEvent>(`${BASE}/${id}/publish`, undefined, "event");

export const unpublishEvent = (id: number) =>
  post<AdminEvent>(`${BASE}/${id}/unpublish`, undefined, "event");

/** Archive, not a guaranteed physical delete — refetch rather than assume. */
export const archiveEvent = (id: number) => del(`${BASE}/${id}`);
