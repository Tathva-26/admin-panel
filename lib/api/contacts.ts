import type {
  Contact,
  ContactQuery,
  ContactStatusInput,
  ListResponse,
} from "@/types";

import { del, get, patch } from "./client";

const BASE = "/admin/contact-messages";

/** Newest first. `status` is free text; new submissions arrive as `NEW`. */
export const listContacts = (query: ContactQuery = {}) =>
  get<ListResponse<Contact>>(BASE, query);

export const getContact = (id: number) =>
  get<Contact>(`${BASE}/${id}`, undefined, "contact");

export const updateContactStatus = (id: number, body: ContactStatusInput) =>
  patch<Contact>(`${BASE}/${id}/status`, body, "contact");

/** A real delete, unlike events — the row does not come back. */
export const deleteContact = (id: number) => del(`${BASE}/${id}`);
