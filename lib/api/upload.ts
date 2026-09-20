import type { UploadFolder, UploadResult } from "@/types";

import { del, postForm } from "./client";

/**
 * Admin-only. Whatever goes in comes back as a `.webp` URL: the backend
 * resizes and recompresses everything under its size budget.
 *
 * Limits worth pre-empting in the UI, because they arrive as errors otherwise:
 * 2 MB in (413), and SVG is rejected outright (400).
 */
export async function uploadImage(
  file: File,
  folder?: UploadFolder,
): Promise<UploadResult> {
  const form = new FormData();
  form.append("image", file);
  if (folder) form.append("folder", folder);

  return postForm<UploadResult>("/upload", form);
}

/**
 * Replacing a picture does not delete the old object — there is no reference
 * counting, and a URL may be shared between rows. Call this only when you know
 * nothing else points at it.
 */
export const deleteImage = (url: string) =>
  del(`/upload?url=${encodeURIComponent(url)}`);
