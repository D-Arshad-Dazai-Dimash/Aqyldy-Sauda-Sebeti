import { pickFallbackKey } from '../components/ProductImage';

describe('pickFallbackKey', () => {
  it('returns groceries when no hints are provided', () => {
    expect(pickFallbackKey({})).toBe('groceries');
  });

  it('detects dairy from Kazakh category', () => {
    expect(pickFallbackKey({ category: 'Сүт өнімдері' })).toBe('dairy');
  });

  it('detects drinks from Russian title', () => {
    expect(pickFallbackKey({ title: 'Минеральная вода 1.5л' })).toBe('drinks');
  });

  it('detects sweets even when title contains "молочный"', () => {
    expect(pickFallbackKey({ title: 'Молочный шоколад' })).toBe('sweets');
  });

  it('detects bakery from slug', () => {
    expect(pickFallbackKey({ categorySlug: 'bakery' })).toBe('bakery');
  });

  it('detects hygiene from English subcategory', () => {
    expect(pickFallbackKey({ subcategory: 'Personal care soap' })).toBe('hygiene');
  });

  it('detects household via Kazakh "тұрмыстық химия"', () => {
    expect(pickFallbackKey({ category: 'Тұрмыстық химия' })).toBe('household');
  });

  it('detects pets', () => {
    expect(pickFallbackKey({ title: 'Корм для кошек' })).toBe('pets');
  });

  it('falls back to groceries for unknown buckets', () => {
    expect(pickFallbackKey({ category: 'Auto parts' })).toBe('groceries');
  });
});
