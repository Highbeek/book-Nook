import { digitsOnly } from './validation';

export const DECLINED_TEST_CARD = '4000000000000002';
export const DEFAULT_PAYMENT_DELAY_MS = 1200;

export interface CardDetails {
  number: string;
  expiry: string;
  cvc: string;
  name: string;
}

export interface PaymentRequest {
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
  return {
    token: randomRef('tok'),
    last4: number.slice(-4),
    declined: number === DECLINED_TEST_CARD,
  };
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
