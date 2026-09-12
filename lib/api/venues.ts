import type { ListResponse, Venue, VenueInput } from "@/types";

import { del, get, patch, post } from "./client";

const BASE = "/admin/venues";

export const listVenues = (params?: { page?: number; pageSize?: number; search?: string; sort?: string; order?: "asc" | "desc" }) =>
  get<ListResponse<Venue>>(BASE, params);

export const createVenue = (body: VenueInput) =>
  post<Venue>(BASE, body, "venue");

export const updateVenue = (id: number, body: Partial<VenueInput>) =>
  patch<Venue>(`${BASE}/${id}`, body, "venue");

export const deleteVenue = (id: number) => del(`${BASE}/${id}`);
