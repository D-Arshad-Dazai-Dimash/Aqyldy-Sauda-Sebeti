import { safeJsonParse } from './storage';

describe('safeJsonParse', () => {
  it('returns fallback for invalid json', () => {
    const result = safeJsonParse<string[]>('{invalid', []);
    expect(result).toEqual([]);
  });

  it('returns fallback for null raw', () => {
    const result = safeJsonParse<string[]>(null, []);
    expect(result).toEqual([]);
  });

  it('returns parsed object for valid json', () => {
    const result = safeJsonParse<string[]>('["milk", "bread"]', []);
    expect(result).toEqual(['milk', 'bread']);
  });
});
