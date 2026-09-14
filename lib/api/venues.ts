import type { ListQuery, ListResponse, Venue, VenueInput } from "@/types";

import { del, get, patch, post } from "./client";

const BASE = "/admin/venues";

export const listVenues = (query: ListQuery = {}) =>
  get<ListResponse<Venue>>(BASE, query);

export const createVenue = (body: VenueInput) =>
  post<Venue>(BASE, body, "venue");

export const updateVenue = (id: number, body: Partial<VenueInput>) =>
  patch<Venue>(`${BASE}/${id}`, body, "venue");

/**
 * Rejected with `409 VENUE_HAS_EVENTS` while any event still references the
 * venue. The caller shows that message and asks the admin to reassign first.
 */
export const deleteVenue = (id: number) => del(`${BASE}/${id}`);
