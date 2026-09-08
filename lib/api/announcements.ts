import type {
  Announcement,
  AnnouncementInput,
  AnnouncementQuery,
  ListResponse,
} from "@/types";

import { del, get, patch, post } from "./client";

const BASE = "/admin/announcements";

export const listAnnouncements = (query: AnnouncementQuery = {}) =>
  get<ListResponse<Announcement>>(BASE, query);

export const getAnnouncement = (id: number) =>
  get<Announcement>(`${BASE}/${id}`, undefined, "announcement");

export const createAnnouncement = (body: AnnouncementInput) =>
  post<Announcement>(BASE, body, "announcement");

export const updateAnnouncement = (id: number, body: Partial<AnnouncementInput>) =>
  patch<Announcement>(`${BASE}/${id}`, body, "announcement");

export const publishAnnouncement = (id: number) =>
  post<Announcement>(`${BASE}/${id}/publish`, undefined, "announcement");

export const unpublishAnnouncement = (id: number) =>
  post<Announcement>(`${BASE}/${id}/unpublish`, undefined, "announcement");

export const deleteAnnouncement = (id: number) => del(`${BASE}/${id}`);
