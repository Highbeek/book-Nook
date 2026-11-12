import * as yup from 'yup';

export const emptyCheckoutValues: CheckoutValues = {
  fullName: '',
  email: '',
  cardNumber: '',
  expiry: '',
  cvc: '',
};

export const digitsOnly = (value: string) => value.replace(/\D/g, '');

export function formatCardNumber(value: string): string {
  return digitsOnly(value)
    .slice(0, 19)
    .replace(/(\d{4})(?=\d)/g, '$1 ');
}

export function formatExpiry(value: string): string {
  const digits = digitsOnly(value).slice(0, 4);
  return digits.length <= 2 ? digits : `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

export function isValidCardNumber(cardNumber: string): boolean {
  return /^\d{12,19}$/.test(digitsOnly(cardNumber));
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

export interface CheckoutSchemaContext {
  now?: Date;
}

export const checkoutSchema = yup.object({
  fullName: yup
    .string()
    .trim()
    .required('Enter the name on the card.')
    .min(2, 'Enter the name on the card.'),
  email: yup
    .string()
    .trim()
    .required('Enter your email for the receipt.')
    .matches(EMAIL_RE, 'Enter a valid email address.'),
  cardNumber: yup
    .string()
    .required('Enter your card number.')
    .test('length', 'Enter a 12–19 digit card number.', (value) => isValidCardNumber(value)),
  expiry: yup
    .string()
    .required('Enter the expiry date.')
    .test('future', 'Use a valid, future MM/YY date.', (value, ctx) =>
      isValidExpiry(value, (ctx.options.context as CheckoutSchemaContext | undefined)?.now),
    ),
  cvc: yup
    .string()
    .required('Enter the 3 or 4 digit security code.')
    .matches(/^\d{3,4}$/, 'Enter the 3 or 4 digit security code.'),
});

export type CheckoutValues = yup.InferType<typeof checkoutSchema>;
