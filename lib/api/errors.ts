/**
 * Turns anything thrown by axios into one predictable shape.
 *
 * Error bodies from this backend are not uniform (API.md §3): older routes put
 * the text in `message`, newer ones in `error`, and a Zod validation failure
 * puts an **array of issues** in `error` rather than a string. A few routes add
 * `code` (`VENUE_HAS_EVENTS`) or `detail` (TIQR's own response). Reading all of
 * that is this file's job, so no screen has to touch `err.response.data`.
 */

import axios from "axios";

import type { ApiErrorBody, ApiIssue } from "@/types";

export interface ApiError {
  /** HTTP status, or 0 when the request never got a response. */
  status: number;
  code: string;
  message: string;
  /** Field-level failures parsed out of a Zod error array, else empty. */
  issues: ApiIssue[];
  /** Whatever the route attached as `detail` — typically TIQR's own body. */
  detail: unknown;
  /** Seconds to wait, parsed from the `Retry-After` header on a 429. */
  retryAfter: number | null;
}

/** Used when the server sent nothing useful, keyed by status. */
const FALLBACK_MESSAGES: Record<number, string> = {
  400: "That request was not valid.",
  401: "Your session is not valid. Sign in again.",
  403: "You do not have access to this.",
  404: "That does not exist, or has been removed.",
  409: "Someone else changed this. Refresh and try again.",
  413: "That file is too large.",
  422: "That file could not be processed.",
  429: "Too many requests. Wait a moment and try again.",
  500: "The server had a problem. Try again.",
  502: "An upstream provider (TIQR or storage) is unavailable. Try again.",
  503: "That service is not configured or is down.",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/**
 * Flattens one Zod issue into `{ path, message }`.
 *
 * Zod reports `path` as an array of segments (`["venue", "name"]`, or `[]` for
 * an error on the object itself). Joining with "." gives the dotted name the
 * forms key their fields by.
 */
function toIssue(raw: unknown): ApiIssue | null {
  if (!isRecord(raw) || typeof raw.message !== "string") return null;

  const path = Array.isArray(raw.path) ? raw.path.join(".") : String(raw.path ?? "");
  return { path, message: raw.message };
}

/**
 * Pulls the human-readable part out of a body, whichever key it landed in.
 *
 * A Zod array is summarised rather than rendered whole — the per-field
 * messages go to `issues` and show beside their inputs, so repeating them in
 * the banner is noise.
 */
function readBody(body: unknown): { message: string | null; issues: ApiIssue[]; code?: string; detail?: unknown } {
  if (!isRecord(body)) return { message: null, issues: [] };

  const known = body as ApiErrorBody;
  const code = typeof known.code === "string" ? known.code : undefined;
  const detail = known.detail;

  if (Array.isArray(known.error)) {
    const issues = known.error
      .map(toIssue)
      .filter((issue): issue is ApiIssue => issue !== null);

    return {
      message: issues.length === 1 ? issues[0].message : "Some fields need fixing.",
      issues,
      code,
      detail,
    };
  }

  const message =
    (typeof known.error === "string" && known.error) ||
    (typeof known.message === "string" && known.message) ||
    null;

  return { message, issues: [], code, detail };
}

function parseRetryAfter(value: unknown): number | null {
  const seconds = Number(value);
  return Number.isFinite(seconds) && seconds > 0 ? seconds : null;
}

export function toApiError(err: unknown): ApiError {
  if (axios.isAxiosError(err)) {
    const response = err.response;

    // No response at all: the backend is down, CORS rejected us, or we timed
    // out. Worth distinguishing, because "try again" is useless advice for the
    // first two.
    if (!response) {
      const timedOut = err.code === "ECONNABORTED" || err.code === "ETIMEDOUT";
      return {
        status: 0,
        code: timedOut ? "TIMEOUT" : "NETWORK_ERROR",
        message: timedOut
          ? "The request timed out."
          : "Could not reach the server. Is the backend running, and is this origin in ALLOWED_ORIGINS?",
        issues: [],
        detail: null,
        retryAfter: null,
      };
    }

    const { message, issues, code, detail } = readBody(response.data);

    return {
      status: response.status,
      code: code ?? "UNKNOWN_ERROR",
      message:
        message ??
        FALLBACK_MESSAGES[response.status] ??
        "Something went wrong.",
      issues,
      detail: detail ?? null,
      retryAfter: parseRetryAfter(response.headers?.["retry-after"]),
    };
  }

  return {
    status: 0,
    code: "UNKNOWN_ERROR",
    message: err instanceof Error ? err.message : "Something went wrong.",
    issues: [],
    detail: null,
    retryAfter: null,
  };
}

/**
 * Maps `issues[].path` onto field names so a form can show each message beside
 * the input it belongs to.
 *
 * First message wins when a field has several — showing one at a time is less
 * noisy than stacking them.
 */
export function fieldErrors(error: ApiError | null): Record<string, string> {
  if (!error) return {};

  const map: Record<string, string> = {};
  for (const issue of error.issues) {
    if (issue.path && !(issue.path in map)) map[issue.path] = issue.message;
  }
  return map;
}

export function apiErrorMessage(error: ApiError): string {
  return error.retryAfter
    ? `${error.message} Try again in ${error.retryAfter}s.`
    : error.message;
}

/** True when retrying the same request unchanged might succeed. */
export function isRetryable(error: ApiError): boolean {
  return error.status === 0 || error.status === 429 || error.status >= 500;
}
