/**
 * Turns anything thrown by axios into one predictable shape.
 *
 * The contract guarantees every error body looks like
 * `{ message, code, details }`, so the UI should never have to reach into
 * `err.response.data` itself — it reads an ApiError instead.
 */

import axios from "axios";

import type { ApiErrorBody, ApiIssue } from "@/types";

export interface ApiError {
  /** HTTP status, or 0 when the request never got a response. */
  status: number;
  code: string;
  message: string;
  /** Field-level failures from `details.issues`, empty when there are none. */
  issues: ApiIssue[];
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
  422: "Some fields need fixing.",
  429: "Too many requests. Wait a moment and try again.",
  500: "The server had a problem. Try again.",
};

function isApiErrorBody(data: unknown): data is ApiErrorBody {
  return (
    typeof data === "object" &&
    data !== null &&
    "message" in data &&
    typeof (data as ApiErrorBody).message === "string"
  );
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
          : "Could not reach the server. Is the backend running?",
        issues: [],
        retryAfter: null,
      };
    }

    const body = response.data;
    const known = isApiErrorBody(body) ? body : null;

    return {
      status: response.status,
      code: known?.code ?? "UNKNOWN_ERROR",
      message:
        known?.message ??
        FALLBACK_MESSAGES[response.status] ??
        "Something went wrong.",
      issues: known?.details?.issues ?? [],
      retryAfter: parseRetryAfter(response.headers?.["retry-after"]),
    };
  }

  return {
    status: 0,
    code: "UNKNOWN_ERROR",
    message: err instanceof Error ? err.message : "Something went wrong.",
    issues: [],
    retryAfter: null,
  };
}

/**
 * Maps `details.issues[].path` onto field names so a form can show each message
 * beside the input it belongs to. Handles nested paths (`venue.name`) as-is,
 * since that is what the backend sends.
 *
 * First message wins when a field has several — showing one at a time is less
 * noisy than stacking them.
 */
export function fieldErrors(error: ApiError | null): Record<string, string> {
  if (!error) return {};

  const map: Record<string, string> = {};
  for (const issue of error.issues) {
    if (!(issue.path in map)) {
      map[issue.path] =
        /^Too small: expected string to have >=\s*1 characters?$/.test(
          issue.message,
        )
          ? "This field is required."
          : issue.message;
    }
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
