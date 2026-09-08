import type { ListResponse, Venue } from "@/types";

import { get } from "./client";

export const listVenues = () =>
  get<ListResponse<Venue>>("/admin/venues");
