/**
 * Conversions at the API boundary.
 *
 * Two rules from the contract that are easy to get wrong and expensive to get
 * wrong quietly:
 *   - money is an integer number of paise, never a float of rupees
 *   - datetimes go over the wire as ISO 8601, but admins think in IST
 */

const IST_TIME_ZONE = "Asia/Kolkata";

/* ------------------------------------------------------------------ */
/* Money                                                               */
/* ------------------------------------------------------------------ */

/*
 * Two different units live in this API, and mixing them charges people the
 * wrong amount:
 *
 *   Booking.amount*  integer PAISE — passed through from TIQR untouched.
 *   Event.price      whole RUPEES — the backend multiplies by 100 itself when
 *                    it syncs a ticket to TIQR (eventSync.service.js:128), so
 *                    sending paise here is converted a second time and bills
 *                    100x at checkout.
 *
 * `formatInr` / `paiseToRupeeInput` are the paise pair, for bookings.
 * `formatRupees` / `rupeeInputValue` / `parseRupeeInput` are the rupee pair,
 * for Event.price. Do not cross them.
 */

/** `499` rupees → `"₹499"`. For Event.price. */
export function formatRupees(rupees: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(rupees ?? 0);
}

/** `499` → `"499"`, for putting into a text input. For Event.price. */
export function rupeeInputValue(rupees: number | null | undefined): string {
  return String(Math.trunc(Number(rupees ?? 0)));
}

/**
 * `"499"` → `499`, or null if it is not a whole, non-negative amount.
 *
 * Whole rupees only: Event.price is an INTEGER column counting rupees, so
 * there is nowhere to put paise. Accepting "499.50" would silently truncate.
 */
export function parseRupeeInput(input: string): number | null {
  const trimmed = input.trim();
  if (!/^\d+$/.test(trimmed)) return null;

  const rupees = Number(trimmed);
  return Number.isSafeInteger(rupees) ? rupees : null;
}

/** `49900` → `"₹499.00"`. */
export function formatInr(paise: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(paise / 100);
}

/** `49900` → `"499.00"`, for putting into a text input. */
export function paiseToRupeeInput(paise: number): string {
  const sign = paise < 0 ? "-" : "";
  const absolute = Math.abs(paise);
  return `${sign}${Math.trunc(absolute / 100)}.${String(absolute % 100).padStart(2, "0")}`;
}

/**
 * `"499"` or `"499.5"` → `49950` paise, or `null` if it is not a valid amount.
 *
 * Deliberately string-based: `Math.round(parseFloat(v) * 100)` is the usual
 * shortcut and it drifts, because 4.99 * 100 is 498.99999999999994.
 */
export function rupeeInputToPaise(input: string): number | null {
  const trimmed = input.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) return null;

  const [whole, fraction = ""] = trimmed.split(".");
  const paise = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));

  return Number.isSafeInteger(paise) ? paise : null;
}

/* ------------------------------------------------------------------ */
/* Dates                                                               */
/* ------------------------------------------------------------------ */

/**
 * Everything is shown in IST regardless of the viewer's clock. The fest happens
 * in one place, and an admin in another timezone seeing their own local time
 * would be actively misleading.
 */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    timeZone: IST_TIME_ZONE,
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

/**
 * Time only, for "until 12:30 pm".
 *
 * A real formatter rather than splitting formatDateTime's output on ", " —
 * that depends on the exact shape Intl happens to produce, and turns into
 * silently wrong output the moment it changes.
 */
export function formatTime(iso: string | null | undefined): string {
  if (!iso) return "—";

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    timeZone: IST_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

/** Date only, for columns where the time is noise. */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    timeZone: IST_TIME_ZONE,
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

/**
 * ISO instant → the `YYYY-MM-DDTHH:mm` an `<input type="datetime-local">` wants,
 * expressed as IST wall-clock time.
 */
export function isoToDateTimeInput(iso: string | null | undefined): string {
  if (!iso) return "";

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: IST_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";

  // hourCycle can yield "24" for midnight; the input needs "00".
  const hour = get("hour") === "24" ? "00" : get("hour");

  return `${get("year")}-${get("month")}-${get("day")}T${hour}:${get("minute")}`;
}

/**
 * `YYYY-MM-DDTHH:mm` read as IST → ISO instant, or `null` if unparseable.
 *
 * India has no daylight saving, so pinning the offset to +05:30 is exact rather
 * than an approximation.
 */
export function dateTimeInputToIso(value: string): string | null {
  if (!value) return null;

  const date = new Date(`${value}:00+05:30`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function isoToDateInput(iso: string | null | undefined): string {
  const dt = isoToDateTimeInput(iso);
  return dt ? dt.slice(0, 10) : "";
}

export function isoToTimeInput(iso: string | null | undefined): string {
  const dt = isoToDateTimeInput(iso);
  return dt ? dt.slice(11, 16) : "";
}
