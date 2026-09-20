import type { AdminUser, ListResponse, Role, UserQuery } from "@/types";

import { get, patch } from "./client";

const BASE = "/admin/users";

export const listUsers = (query: UserQuery = {}) =>
  get<ListResponse<AdminUser>>(BASE, query);

/** `id` is a nanoid(10) string like `V1StGXR8_Z`, not a number. */
export const getUser = (id: string) =>
  get<AdminUser>(`${BASE}/${id}`, undefined, "user");

/**
 * Promoting to CA does **not** create a referral code — TIQR issues one the
 * first time that user calls `/api/referrals/code`.
 *
 * A CA cannot be demoted: the backend rejects it with
 * `400 "Demotion of CA users is not allowed"`.
 */
export const updateUserRole = (id: string, role: Role) =>
  patch<AdminUser>(`${BASE}/${id}/role`, { role }, "user");
