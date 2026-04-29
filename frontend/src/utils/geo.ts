// Geographic helpers: haversine distance and nearest-store picker.
//
// Extracted so the same logic can be reused from MapScreen, ScanScreen,
// the locationStore and recommendations widgets. Pure functions only —
// no React, no async, no side effects — so they're trivially testable
// from Jest without RN mocks.

export type LatLng = { latitude: number; longitude: number };

export function toRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Great-circle distance in kilometers between two points on Earth.
 */
export function distanceKm(a: LatLng, b: LatLng): number {
  const earthKm = 6371;
  const dLat = toRadians(b.latitude - a.latitude);
  const dLng = toRadians(b.longitude - a.longitude);
  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);
  const hav =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * earthKm * Math.asin(Math.sqrt(hav));
}

export function isValidCoord(lat: unknown, lng: unknown): boolean {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lng) <= 180 &&
    !(lat === 0 && lng === 0)
  );
}

/**
 * Returns the store closest to the user. Returns `null` when no candidate
 * has valid coordinates or when the candidate list is empty.
 */
export function pickNearestStore<
  T extends { id?: string | null; latitude?: number | null; longitude?: number | null },
>(user: LatLng, stores: T[] | null | undefined): T | null {
  if (!stores || stores.length === 0) return null;
  let best: T | null = null;
  let bestDist = Number.POSITIVE_INFINITY;
  for (const s of stores) {
    if (!isValidCoord(s.latitude, s.longitude)) continue;
    const d = distanceKm(user, {
      latitude: s.latitude as number,
      longitude: s.longitude as number,
    });
    if (d < bestDist) {
      bestDist = d;
      best = s;
    }
  }
  return best;
}
