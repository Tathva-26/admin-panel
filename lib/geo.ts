/**
 * Coordinate helpers for the venue form.
 *
 * Why no map library: the Google Maps JS API needs a billing-enabled API key,
 * which is a poor fit for an internal tool nobody wants to provision keys for,
 * and Leaflet would be a dependency for one field. Both are avoidable — an
 * admin already knows how to get a Google Maps link, and OpenStreetMap serves
 * an embeddable preview with no key at all.
 */

export interface LatLng {
  latitude: number;
  longitude: number;
}

const LAT_LIMIT = 90;
const LNG_LIMIT = 180;

export function isValidLatLng(latitude: number, longitude: number): boolean {
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    Math.abs(latitude) <= LAT_LIMIT &&
    Math.abs(longitude) <= LNG_LIMIT
  );
}

/**
 * Pulls coordinates out of whatever an admin pastes.
 *
 * Handles the forms a Google Maps URL actually takes, plus a bare pair:
 *   .../maps/@11.3213,75.9331,17z
 *   .../maps/place/NIT+Calicut/@11.32,75.93,17z/data=…!3d11.3213!4d75.9331
 *   .../maps?q=11.3213,75.9331     ?ll=…    ?query=…
 *   11.3213, 75.9331
 *
 * `!3d…!4d…` is checked first: on a place URL the `@` part is the *camera*
 * centre, which can sit some distance from the pin, whereas 3d/4d is the pin.
 *
 * Returns null for a short `maps.app.goo.gl` link — resolving one needs a
 * redirect the browser cannot follow cross-origin, so the caller tells the
 * admin to paste the full URL instead.
 */
export function parseLatLng(input: string): LatLng | null {
  const text = input.trim();
  if (!text) return null;

  const patterns = [
    /!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/, // place pin
    /@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/, // camera centre
    /[?&](?:q|ll|query|daddr)=(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/, // query param
    /^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/, // bare "lat, lng"
  ];

  for (const pattern of patterns) {
    const match = pattern.exec(text);
    if (!match) continue;

    const latitude = Number(match[1]);
    const longitude = Number(match[2]);
    if (isValidLatLng(latitude, longitude)) return { latitude, longitude };
  }

  return null;
}

/** True for the shortened share links we cannot resolve in the browser. */
export function isShortMapsLink(input: string): boolean {
  return /(?:maps\.app\.goo\.gl|goo\.gl\/maps)/i.test(input);
}

/**
 * OpenStreetMap's embed endpoint — no API key, no script, just an iframe.
 * The box is deliberately tight so the pin reads as a specific spot.
 */
export function osmEmbedUrl({ latitude, longitude }: LatLng): string {
  const pad = 0.004;
  const bbox = [
    longitude - pad,
    latitude - pad,
    longitude + pad,
    latitude + pad,
  ].join(",");

  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${latitude},${longitude}`;
}

/** Opens the same point in whatever map app the admin actually uses. */
export function googleMapsUrl({ latitude, longitude }: LatLng): string {
  return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
}
