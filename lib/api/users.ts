import type { AdminUser, ListResponse, RoleInput, UserQuery } from "@/types";

import { get, patch } from "./client";

const BASE = "/admin/users";

export const listUsers = (query: UserQuery = {}) =>
  get<ListResponse<AdminUser>>(BASE, query);

export const getUser = (id: number) =>
  get<AdminUser>(`${BASE}/${id}`, undefined, "user");

/**
 * Sensitive: the backend may refuse to remove the last remaining admin, so the
 * caller must surface the error rather than assume success.
 */
export const updateUserRole = (id: number, body: RoleInput) =>
  patch<AdminUser>(`${BASE}/${id}/role`, body, "user");
