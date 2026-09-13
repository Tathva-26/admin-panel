import type { ListQuery, ListResponse, Venue, VenueInput } from "@/types";

import { del, get, patch, post } from "./client";

const BASE = "/admin/venues";

/**
 * `GET /admin/venues` accepts no query params — it returns every venue behind a
 * fake paged envelope. `search`, `page` and `pageSize` are therefore applied
 * here. Once the backend supports them, delete this and pass the query through.
 */
export const listVenues = async (
  query: ListQuery = {},
): Promise<ListResponse<Venue>> => {
  const all = await get<ListResponse<Venue>>(BASE);

  const search = query.search?.trim().toLowerCase();
  const filtered = search
    ? all.items.filter(
        (venue) =>
          venue.name.toLowerCase().includes(search) ||
          (venue.address?.toLowerCase().includes(search) ?? false),
      )
    : all.items;

  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? filtered.length;
  const start = (page - 1) * pageSize;

  return {
    items: filtered.slice(start, start + pageSize),
    page,
    pageSize,
    total: filtered.length,
  };
};

export const createVenue = (body: VenueInput) =>
  post<Venue>(BASE, body, "venue");

export const updateVenue = (id: number, body: Partial<VenueInput>) =>
  patch<Venue>(`${BASE}/${id}`, body, "venue");

/**
 * Rejected with `409 VENUE_HAS_EVENTS` while any event still references the
 * venue. The caller shows that message and asks the admin to reassign first.
 */
export const deleteVenue = (id: number) => del(`${BASE}/${id}`);
