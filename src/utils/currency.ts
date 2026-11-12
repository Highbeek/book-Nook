import { CURRENCY } from '@/api/pricing';

const wholeFormatter = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: CURRENCY,
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const fractionalFormatter = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: CURRENCY,
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatPrice(minorUnits: number): string {
  if (!Number.isFinite(minorUnits)) return '—';
  const rounded = Math.round(minorUnits);
  const formatter = rounded % 100 === 0 ? wholeFormatter : fractionalFormatter;
  return formatter.format(rounded / 100);
}
