import { ValidationError } from 'yup';

import {
  checkoutSchema,
  formatCardNumber,
  formatExpiry,
  isValidExpiry,
  isValidCardNumber,
  type CheckoutValues,
} from '../validation';

const NOW = new Date(2026, 10, 12);

function validate(values: CheckoutValues): Partial<Record<keyof CheckoutValues, string>> {
  try {
    checkoutSchema.validateSync(values, { abortEarly: false, context: { now: NOW } });
    return {};
  } catch (error) {
    if (!(error instanceof ValidationError)) throw error;
    const errors: Record<string, string> = {};
    for (const inner of error.inner) {
      if (inner.path && !(inner.path in errors)) errors[inner.path] = inner.message;
    }
    return errors;
  }
}

const valid: CheckoutValues = {
  fullName: 'Ada Lovelace',
  email: 'ada@example.com',
  cardNumber: '4242 4242 4242 4242',
  expiry: '12/28',
  cvc: '123',
};

describe('isValidCardNumber', () => {
  it.each(['4242424242424242', '4242 4242 4242 4241', '1234 5678 9012', '1'.repeat(19)])(
    'accepts any 12–19 digit number: %s',
    (card) => expect(isValidCardNumber(card)).toBe(true),
  );

  it.each(['', '1234', '1'.repeat(11), '1'.repeat(20)])('rejects %p', (card) =>
    expect(isValidCardNumber(card)).toBe(false),
  );
});

describe('isValidExpiry', () => {
  it('accepts the current month and future dates', () => {
    expect(isValidExpiry('11/26', NOW)).toBe(true);
    expect(isValidExpiry('01/27', NOW)).toBe(true);
  });

  it('rejects past dates, invalid months and bad formats', () => {
    expect(isValidExpiry('10/26', NOW)).toBe(false);
    expect(isValidExpiry('13/27', NOW)).toBe(false);
    expect(isValidExpiry('00/27', NOW)).toBe(false);
    expect(isValidExpiry('1227', NOW)).toBe(false);
  });
});

describe('formatters', () => {
  it('groups card digits in fours and strips non-digits', () => {
    expect(formatCardNumber('4242-4242 4242x4242')).toBe('4242 4242 4242 4242');
    expect(formatCardNumber('42424')).toBe('4242 4');
  });

  it('inserts the expiry slash as the user types', () => {
    expect(formatExpiry('1')).toBe('1');
    expect(formatExpiry('12')).toBe('12');
    expect(formatExpiry('122')).toBe('12/2');
    expect(formatExpiry('12/289')).toBe('12/28');
  });
});

describe('checkoutSchema', () => {
  it('passes valid input', () => {
    expect(validate(valid)).toEqual({});
  });

  it('asks for every missing field', () => {
    expect(validate({ fullName: '', email: '', cardNumber: '', expiry: '', cvc: '' })).toEqual({
      fullName: 'Enter the name on the card.',
      email: 'Enter your email for the receipt.',
      cardNumber: 'Enter your card number.',
      expiry: 'Enter the expiry date.',
      cvc: 'Enter the 3 or 4 digit security code.',
    });
  });

  it('treats a whitespace-only name as missing', () => {
    expect(validate({ ...valid, fullName: '   ' })).toEqual({
      fullName: 'Enter the name on the card.',
    });
  });

  it('flags malformed values with specific messages', () => {
    expect(
      validate({
        ...valid,
        fullName: 'A',
        email: 'ada@',
        cardNumber: '4242 4242',
        expiry: '01/20',
        cvc: '12',
      }),
    ).toEqual({
      fullName: 'Enter the name on the card.',
      email: 'Enter a valid email address.',
      cardNumber: 'Enter a 12–19 digit card number.',
      expiry: 'Use a valid, future MM/YY date.',
      cvc: 'Enter the 3 or 4 digit security code.',
    });
  });

  it('rejects an impossible expiry month', () => {
    expect(validate({ ...valid, expiry: '13/30' })).toEqual({
      expiry: 'Use a valid, future MM/YY date.',
    });
  });

  it('trims name and email in the submitted values', () => {
    const out = checkoutSchema.validateSync(
      { ...valid, fullName: '  Ada Lovelace ', email: ' ada@example.com ' },
      { context: { now: NOW } },
    );
    expect(out).toMatchObject({ fullName: 'Ada Lovelace', email: 'ada@example.com' });
  });
});
