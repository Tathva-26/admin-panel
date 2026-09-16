import type { AdminUser, ListResponse, UserQuery } from "@/types";

import { get } from "./client";

const BASE = "/admin/users";

export const listUsers = (query: UserQuery = {}) =>
  get<ListResponse<AdminUser>>(BASE, query);

export const getUser = (id: number) =>
  get<AdminUser>(`${BASE}/${id}`, undefined, "user");
