const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string) {
  return EMAIL_RE.test(email.trim());
}

export function isStrongEnoughPassword(password: string) {
  return password.trim().length >= 6;
}

export function getApiErrorMessage(error: any, fallback: string) {
  return error?.response?.data?.message
    || error?.response?.data?.detail
    || error?.message
    || fallback;
}

export function isValidCardNumber(cardNumber: string) {
  const digits = cardNumber.replace(/\D/g, '');
  if (digits.length < 12) {
    return false;
  }

  let sum = 0;
  let shouldDouble = false;

  for (let index = digits.length - 1; index >= 0; index -= 1) {
    let digit = Number(digits[index]);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return sum % 10 === 0;
}

export function isValidExpiry(expiry: string) {
  if (!/^\d{2}\/(\d{2}|\d{4})$/.test(expiry)) {
    return false;
  }

  const [monthRaw, yearRaw] = expiry.split('/');
  const month = Number(monthRaw);
  const year = yearRaw.length === 4 ? Number(yearRaw.slice(-2)) : Number(yearRaw);

  if (month < 1 || month > 12) {
    return false;
  }

  const now = new Date();
  const currentYear = now.getFullYear() % 100;
  const currentMonth = now.getMonth() + 1;

  if (year < currentYear) {
    return false;
  }

  if (year === currentYear && month < currentMonth) {
    return false;
  }

  return true;
}