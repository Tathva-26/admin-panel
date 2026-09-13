import type {
  ContactMessage,
  ContactQuery,
  ContactStatusInput,
  ListResponse,
} from "@/types";

import { get, patch } from "./client";

const BASE = "/admin/contact-messages";

export const listContactMessages = (query: ContactQuery = {}) =>
  get<ListResponse<ContactMessage>>(BASE, query);

/**
 * The single-message endpoints wrap their payload in `message`, which is also
 * the key the error shape uses. Only success responses reach `unwrap`, so the
 * two never collide — but the name is worth knowing before changing it.
 */
export const getContactMessage = (id: number) =>
  get<ContactMessage>(`${BASE}/${id}`, undefined, "message");

export const updateContactStatus = (id: number, body: ContactStatusInput) =>
  patch<ContactMessage>(`${BASE}/${id}/status`, body, "message");
