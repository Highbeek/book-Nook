import {
  formatCardNumber,
  formatExpiry,
  hasErrors,
  isValidExpiry,
  isValidLuhn,
  validateCheckout,
  type CheckoutValues,
} from '../validation';

const NOW = new Date(2026, 10, 12); // 12 Nov 2026

const valid: CheckoutValues = {
  fullName: 'Ada Lovelace',
  email: 'ada@example.com',
  cardNumber: '4242 4242 4242 4242',
  expiry: '12/28',
  cvc: '123',
};

describe('isValidLuhn', () => {
  it.each(['4242424242424242', '4000 0000 0000 0002', '5555555555554444', '378282246310005'])(
    'accepts valid test card %s',
    (card) => expect(isValidLuhn(card)).toBe(true),
  );

  it.each(['4242424242424241', '1234', '', '0'.repeat(20)])('rejects %p', (card) =>
    expect(isValidLuhn(card)).toBe(false),
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

describe('validateCheckout', () => {
  it('passes valid input', () => {
    expect(hasErrors(validateCheckout(valid, NOW))).toBe(false);
  });

  it('flags every missing field', () => {
    const errors = validateCheckout(
      { fullName: '', email: '', cardNumber: '', expiry: '', cvc: '' },
      NOW,
    );
    expect(Object.keys(errors).sort()).toEqual(
      ['cardNumber', 'cvc', 'email', 'expiry', 'fullName'].sort(),
    );
  });

  it('flags malformed values with specific messages', () => {
    const errors = validateCheckout(
      { ...valid, email: 'ada@', cardNumber: '4242 4242 4242 4241', expiry: '01/20', cvc: '12' },
      NOW,
    );
    expect(errors).toEqual({
      email: 'Enter a valid email address.',
      cardNumber: 'This card number is not valid.',
      expiry: 'Use a valid, future MM/YY date.',
      cvc: 'Enter the 3 or 4 digit security code.',
    });
  });
});
