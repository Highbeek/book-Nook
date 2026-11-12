import { DECLINED_TEST_CARD, PaymentError, processPayment } from '../paymentService';

const card = { number: '4242 4242 4242 4242', expiry: '12/28', cvc: '123', name: 'Ada' };

describe('processPayment (mock gateway)', () => {
  it('returns a receipt with a reference and only the last 4 digits', async () => {
    const receipt = await processPayment(
      { amount: 7_500_00, email: 'ada@example.com', card },
      { delayMs: 0 },
    );
    expect(receipt).toEqual({
      reference: expect.stringMatching(/^BN_/),
      amount: 7_500_00,
      last4: '4242',
      paidAt: expect.any(String),
    });
    expect(JSON.stringify(receipt)).not.toContain('4242424242424242');
  });

  it('declines the declined test card', async () => {
    await expect(
      processPayment(
        { amount: 100, email: 'a@b.co', card: { ...card, number: DECLINED_TEST_CARD } },
        { delayMs: 0 },
      ),
    ).rejects.toThrow(PaymentError);
  });

  it('refuses non-positive or fractional amounts', async () => {
    await expect(
      processPayment({ amount: 0, email: 'a@b.co', card }, { delayMs: 0 }),
    ).rejects.toThrow('Your cart is empty.');
    await expect(
      processPayment({ amount: 10.5, email: 'a@b.co', card }, { delayMs: 0 }),
    ).rejects.toThrow(PaymentError);
  });
});
