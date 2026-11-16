import { detectUserCurrency, formatCurrency } from './currency';

export type StoreCurrency = 'USD' | 'INR' | 'GBP' | 'EUR' | 'CAD' | 'AUD' | 'AED' | 'SGD' | 'JPY';

const FX_FROM_USD: Record<StoreCurrency, number> = {
  USD: 1,
  INR: 83.5,
  GBP: 0.79,
  EUR: 0.92,
  CAD: 1.36,
  AUD: 1.52,
  AED: 3.67,
  SGD: 1.34,
  JPY: 152,
};

export const STORE_CURRENCIES: { code: StoreCurrency; label: string }[] = [
  { code: 'USD', label: 'USD ($)' },
  { code: 'INR', label: 'INR (₹)' },
  { code: 'GBP', label: 'GBP (£)' },
  { code: 'EUR', label: 'EUR (€)' },
  { code: 'CAD', label: 'CAD (CA$)' },
  { code: 'AUD', label: 'AUD (A$)' },
  { code: 'AED', label: 'AED' },
  { code: 'SGD', label: 'SGD (S$)' },
  { code: 'JPY', label: 'JPY (¥)' },
];

export function getInitialStoreCurrency(): StoreCurrency {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('store_currency');
    if (saved && saved in FX_FROM_USD) {
      return saved as StoreCurrency;
    }
  }
  const detected = detectUserCurrency().code.toUpperCase();
  if (detected in FX_FROM_USD) {
    return detected as StoreCurrency;
  }
  return 'USD';
}

export function getProductPriceInCurrency(
  priceUsd: number,
  priceInr: number,
  currency: StoreCurrency
): number {
  if (currency === 'INR') {
    return Math.round(priceInr || priceUsd * FX_FROM_USD.INR);
  }
  if (currency === 'USD') {
    return Number((priceUsd || 0).toFixed(2));
  }
  const converted = (priceUsd || 0) * (FX_FROM_USD[currency] || 1);
  if (currency === 'JPY') {
    return Math.round(converted);
  }
  return Number(converted.toFixed(2));
}

export function formatStorePrice(
  priceUsd: number,
  priceInr: number,
  currency: StoreCurrency
): string {
  const value = getProductPriceInCurrency(priceUsd, priceInr, currency);
  const locale = currency === 'INR' ? 'en-IN' : undefined;
  return formatCurrency(value, currency, locale);
}

export function formatRawStoreAmount(amount: number, currency: StoreCurrency): string {
  const locale = currency === 'INR' ? 'en-IN' : undefined;
  return formatCurrency(amount, currency, locale);
}

export function getFreeShippingThreshold(currency: StoreCurrency): number {
  if (currency === 'INR') return 2999;
  if (currency === 'JPY') return 12000;
  return Math.round(75 * (FX_FROM_USD[currency] || 1));
}

export function getFlatShippingFee(currency: StoreCurrency): number {
  if (currency === 'INR') return 149;
  if (currency === 'JPY') return 1200;
  return Number((7.99 * (FX_FROM_USD[currency] || 1)).toFixed(2));
}
