/**
 * Helpers for reading URL query values, which are always strings, into the
 * types an API query object wants. Each returns `undefined` for absent or
 * unrecognised input, so an unusable filter is simply not sent.
 */

export function asNumber(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function asBool(value: string | undefined): boolean | undefined {
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}

/**
 * Narrows a raw string to one of a known set, so a hand-edited URL cannot push
 * a nonsense filter to the backend.
 */
export function asEnum<T extends string>(
  value: string | undefined,
  allowed: readonly T[],
): T | undefined {
  return allowed.includes(value as T) ? (value as T) : undefined;
}

/** Trims and drops empty strings, for free-text params like `search`. */
export function asText(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}
