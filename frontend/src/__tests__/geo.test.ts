import { distanceKm, isValidCoord, pickNearestStore } from '../utils/geo';

describe('geo helpers', () => {
  describe('distanceKm', () => {
    it('is zero for identical points', () => {
      const p = { latitude: 43.238949, longitude: 76.889709 };
      expect(distanceKm(p, p)).toBeCloseTo(0, 6);
    });

    it('matches the canonical Almaty -> Astana distance (~970 km)', () => {
      const almaty = { latitude: 43.238949, longitude: 76.889709 };
      const astana = { latitude: 51.169392, longitude: 71.449074 };
      const km = distanceKm(almaty, astana);
      expect(km).toBeGreaterThan(960);
      expect(km).toBeLessThan(1000);
    });
  });

  describe('isValidCoord', () => {
    it('rejects null island (0,0)', () => {
      expect(isValidCoord(0, 0)).toBe(false);
    });
    it('rejects out-of-range', () => {
      expect(isValidCoord(120, 0)).toBe(false);
      expect(isValidCoord(0, 200)).toBe(false);
    });
    it('rejects non-numbers', () => {
      expect(isValidCoord('43', 76)).toBe(false);
      expect(isValidCoord(undefined, undefined)).toBe(false);
      expect(isValidCoord(NaN, 0)).toBe(false);
    });
    it('accepts valid Almaty coordinates', () => {
      expect(isValidCoord(43.24, 76.89)).toBe(true);
    });
  });

  describe('pickNearestStore', () => {
    const user = { latitude: 43.238949, longitude: 76.889709 };
    const stores = [
      { id: 'a', latitude: 51.169, longitude: 71.449 }, // Astana, far
      { id: 'b', latitude: 43.245, longitude: 76.895 }, // ~700m
      { id: 'c', latitude: null, longitude: null },     // skipped
      { id: 'd', latitude: 43.260, longitude: 76.930 }, // ~4km
    ];

    it('returns the closest valid store', () => {
      const nearest = pickNearestStore(user, stores);
      expect(nearest?.id).toBe('b');
    });

    it('returns null for empty list', () => {
      expect(pickNearestStore(user, [])).toBeNull();
      expect(pickNearestStore(user, null)).toBeNull();
    });

    it('returns null when no store has valid coords', () => {
      expect(
        pickNearestStore(user, [{ id: 'x', latitude: null, longitude: null }]),
      ).toBeNull();
    });
  });
});
