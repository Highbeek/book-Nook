export interface CheckoutValues {
  fullName: string;
  email: string;
  cardNumber: string;
  expiry: string;
  cvc: string;
}

export type CheckoutErrors = Partial<Record<keyof CheckoutValues, string>>;

export const emptyCheckoutValues: CheckoutValues = {
  fullName: '',
  email: '',
  cardNumber: '',
  expiry: '',
  cvc: '',
};

export const digitsOnly = (value: string) => value.replace(/\D/g, '');

/** "4242424242424242" -> "4242 4242 4242 4242" (max 19 digits). */
export function formatCardNumber(value: string): string {
  return digitsOnly(value)
    .slice(0, 19)
    .replace(/(\d{4})(?=\d)/g, '$1 ');
}

/** "1229" -> "12/29"; keeps the slash while the user types. */
export function formatExpiry(value: string): string {
  const digits = digitsOnly(value).slice(0, 4);
  return digits.length <= 2 ? digits : `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

export function isValidLuhn(cardNumber: string): boolean {
  const digits = digitsOnly(cardNumber);
  if (digits.length < 12 || digits.length > 19) return false;
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = Number(digits[i]);
    if (double) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    double = !double;
  }
  return sum % 10 === 0;
}

export function isValidExpiry(expiry: string, now: Date = new Date()): boolean {
  const match = expiry.match(/^(\d{2})\/(\d{2})$/);
  if (!match) return false;
  const month = Number(match[1]);
  const year = 2000 + Number(match[2]);
  if (month < 1 || month > 12) return false;
  const thisYear = now.getFullYear();
  const thisMonth = now.getMonth() + 1;
  return year > thisYear || (year === thisYear && month >= thisMonth);
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateCheckout(values: CheckoutValues, now: Date = new Date()): CheckoutErrors {
  const errors: CheckoutErrors = {};

  if (values.fullName.trim().length < 2) errors.fullName = 'Enter the name on the card.';

  if (!values.email.trim()) errors.email = 'Enter your email for the receipt.';
  else if (!EMAIL_RE.test(values.email.trim())) errors.email = 'Enter a valid email address.';

  if (!digitsOnly(values.cardNumber)) errors.cardNumber = 'Enter your card number.';
  else if (!isValidLuhn(values.cardNumber)) errors.cardNumber = 'This card number is not valid.';

  if (!values.expiry) errors.expiry = 'Enter the expiry date.';
  else if (!isValidExpiry(values.expiry, now)) errors.expiry = 'Use a valid, future MM/YY date.';

  if (!/^\d{3,4}$/.test(values.cvc)) errors.cvc = 'Enter the 3 or 4 digit security code.';

  return errors;
}

export const hasErrors = (errors: CheckoutErrors) => Object.keys(errors).length > 0;
