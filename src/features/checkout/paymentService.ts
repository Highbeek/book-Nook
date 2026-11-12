import { digitsOnly } from './validation';

/**
 * MOCK payment gateway — no real money moves and no card data leaves the device.
 *
 * It mirrors the shape of a real hosted-payments integration (e.g. Paystack / Stripe):
 * 1. the card is exchanged for a single-use token ("tokenisation"),
 * 2. only the token + amount are sent to "charge",
 * 3. the raw card number is never stored, logged, or returned.
 * See the README for what a production implementation would need.
 */

/** Test card that always declines, like the real providers' test numbers. */
export const DECLINED_TEST_CARD = '4000000000000002';
export const DEFAULT_PAYMENT_DELAY_MS = 1200;

export interface CardDetails {
  number: string;
  expiry: string;
  cvc: string;
  name: string;
}

export interface PaymentRequest {
  /** Minor units (kobo). */
  amount: number;
  email: string;
  card: CardDetails;
}

export interface PaymentReceipt {
  reference: string;
  amount: number;
  last4: string;
  paidAt: string;
}

export class PaymentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PaymentError';
  }
}

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function randomRef(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`.toUpperCase();
}

async function tokenizeCard(card: CardDetails) {
  const number = digitsOnly(card.number);
  if (number === DECLINED_TEST_CARD)
    return { token: randomRef('tok'), last4: number.slice(-4), declined: true };
  return { token: randomRef('tok'), last4: number.slice(-4), declined: false };
}

export async function processPayment(
  request: PaymentRequest,
  { delayMs = DEFAULT_PAYMENT_DELAY_MS }: { delayMs?: number } = {},
): Promise<PaymentReceipt> {
  if (!Number.isInteger(request.amount) || request.amount <= 0) {
    throw new PaymentError('Your cart is empty.');
  }
  const { last4, declined } = await tokenizeCard(request.card);
  await wait(delayMs);
  if (declined) {
    throw new PaymentError('Your card was declined. Please use a different card.');
  }
  return {
    reference: randomRef('BN'),
    amount: request.amount,
    last4,
    paidAt: new Date().toISOString(),
  };
}

export type PaymentProcessor = typeof processPayment;
