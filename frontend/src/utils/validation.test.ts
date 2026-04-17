import {
  getApiErrorMessage,
  isStrongEnoughPassword,
  isValidCardNumber,
  isValidEmail,
  isValidExpiry,
} from './validation';

describe('validation helpers', () => {
  it('validates email format', () => {
    expect(isValidEmail('user@example.com')).toBe(true);
    expect(isValidEmail('broken-email')).toBe(false);
  });

  it('checks password minimum length', () => {
    expect(isStrongEnoughPassword('123456')).toBe(true);
    expect(isStrongEnoughPassword('12345')).toBe(false);
  });

  it('validates card number by luhn algorithm', () => {
    expect(isValidCardNumber('4242 4242 4242 4242')).toBe(true);
    expect(isValidCardNumber('4242 4242 4242 4241')).toBe(false);
  });

  it('rejects expired cards', () => {
    expect(isValidExpiry('01/20')).toBe(false);
  });

  it('accepts future expiry in MM/YY format', () => {
    expect(isValidExpiry('12/30')).toBe(true);
  });

  it('accepts future expiry in MM/YYYY format', () => {
    expect(isValidExpiry('12/2030')).toBe(true);
  });

  it('extracts api error messages safely', () => {
    expect(getApiErrorMessage({ response: { data: { message: 'boom' } } }, 'fallback')).toBe('boom');
    expect(getApiErrorMessage({}, 'fallback')).toBe('fallback');
  });
});