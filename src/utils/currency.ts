export interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
  countryName: string;
  monthlyPrice: number;
  yearlyPrice: number;
  formattedMonthly: string;
  formattedYearly: string;
  formattedYearlyMonthlyEquivalent: string;
}

export const SUPPORTED_CURRENCIES: Record<string, CurrencyInfo> = {
  USD: {
    code: 'usd',
    symbol: '$',
    name: 'US Dollar',
    countryName: 'United States',
    monthlyPrice: 2.99,
    yearlyPrice: 29.90,
    formattedMonthly: '$2.99',
    formattedYearly: '$29.90',
    formattedYearlyMonthlyEquivalent: '$2.49/mo'
  },
  INR: {
    code: 'inr',
    symbol: '₹',
    name: 'Indian Rupee',
    countryName: 'India',
    monthlyPrice: 249,
    yearlyPrice: 2490,
    formattedMonthly: '₹249',
    formattedYearly: '₹2,490',
    formattedYearlyMonthlyEquivalent: '₹207.50/mo'
  },
  EUR: {
    code: 'eur',
    symbol: '€',
    name: 'Euro',
    countryName: 'Eurozone',
    monthlyPrice: 2.79,
    yearlyPrice: 27.90,
    formattedMonthly: '€2.79',
    formattedYearly: '€27.90',
    formattedYearlyMonthlyEquivalent: '€2.32/mo'
  },
  GBP: {
    code: 'gbp',
    symbol: '£',
    name: 'British Pound',
    countryName: 'United Kingdom',
    monthlyPrice: 2.39,
    yearlyPrice: 23.90,
    formattedMonthly: '£2.39',
    formattedYearly: '£23.90',
    formattedYearlyMonthlyEquivalent: '£1.99/mo'
  },
  CAD: {
    code: 'cad',
    symbol: 'CA$',
    name: 'Canadian Dollar',
    countryName: 'Canada',
    monthlyPrice: 3.99,
    yearlyPrice: 39.90,
    formattedMonthly: 'CA$3.99',
    formattedYearly: 'CA$39.90',
    formattedYearlyMonthlyEquivalent: 'CA$3.32/mo'
  },
  AUD: {
    code: 'aud',
    symbol: 'A$',
    name: 'Australian Dollar',
    countryName: 'Australia',
    monthlyPrice: 4.49,
    yearlyPrice: 44.90,
    formattedMonthly: 'A$4.49',
    formattedYearly: 'A$44.90',
    formattedYearlyMonthlyEquivalent: 'A$3.74/mo'
  },
  JPY: {
    code: 'jpy',
    symbol: '¥',
    name: 'Japanese Yen',
    countryName: 'Japan',
    monthlyPrice: 450,
    yearlyPrice: 4500,
    formattedMonthly: '¥450',
    formattedYearly: '¥4,500',
    formattedYearlyMonthlyEquivalent: '¥375/mo'
  },
  AED: {
    code: 'aed',
    symbol: 'AED ',
    name: 'UAE Dirham',
    countryName: 'United Arab Emirates',
    monthlyPrice: 10.99,
    yearlyPrice: 109.90,
    formattedMonthly: 'AED 10.99',
    formattedYearly: 'AED 109.90',
    formattedYearlyMonthlyEquivalent: 'AED 9.15/mo'
  },
  SGD: {
    code: 'sgd',
    symbol: 'S$',
    name: 'Singapore Dollar',
    countryName: 'Singapore',
    monthlyPrice: 3.99,
    yearlyPrice: 39.90,
    formattedMonthly: 'S$3.99',
    formattedYearly: 'S$39.90',
    formattedYearlyMonthlyEquivalent: 'S$3.32/mo'
  },
  BRL: {
    code: 'brl',
    symbol: 'R$',
    name: 'Brazilian Real',
    countryName: 'Brazil',
    monthlyPrice: 14.90,
    yearlyPrice: 149.00,
    formattedMonthly: 'R$14.90',
    formattedYearly: 'R$149.00',
    formattedYearlyMonthlyEquivalent: 'R$12.41/mo'
  },
  MXN: {
    code: 'mxn',
    symbol: 'MX$',
    name: 'Mexican Peso',
    countryName: 'Mexico',
    monthlyPrice: 54.90,
    yearlyPrice: 549.00,
    formattedMonthly: 'MX$54.90',
    formattedYearly: 'MX$549.00',
    formattedYearlyMonthlyEquivalent: 'MX$45.75/mo'
  }
};

export function detectUserCurrency(locationOverride?: string): CurrencyInfo {
  // 1. Explicit override or saved location check
  const locStr = (locationOverride || localStorage.getItem('match_location') || localStorage.getItem('user_location') || '').toLowerCase();

  if (locStr) {
    if (locStr.includes('india') || locStr.includes('hyderabad') || locStr.includes('mumbai') || locStr.includes('delhi') || locStr.includes('bengaluru') || locStr.includes('kolkata') || locStr.includes('chennai') || locStr.includes('pune')) {
      return SUPPORTED_CURRENCIES.INR;
    }
    if (locStr.includes('uk') || locStr.includes('united kingdom') || locStr.includes('london') || locStr.includes('england') || locStr.includes('britain')) {
      return SUPPORTED_CURRENCIES.GBP;
    }
    if (locStr.includes('germany') || locStr.includes('france') || locStr.includes('spain') || locStr.includes('italy') || locStr.includes('netherlands') || locStr.includes('europe') || locStr.includes('ireland')) {
      return SUPPORTED_CURRENCIES.EUR;
    }
    if (locStr.includes('canada') || locStr.includes('toronto') || locStr.includes('vancouver') || locStr.includes('montreal')) {
      return SUPPORTED_CURRENCIES.CAD;
    }
    if (locStr.includes('australia') || locStr.includes('sydney') || locStr.includes('melbourne') || locStr.includes('brisbane') || locStr.includes('perth')) {
      return SUPPORTED_CURRENCIES.AUD;
    }
    if (locStr.includes('japan') || locStr.includes('tokyo') || locStr.includes('osaka')) {
      return SUPPORTED_CURRENCIES.JPY;
    }
    if (locStr.includes('uae') || locStr.includes('dubai') || locStr.includes('abu dhabi') || locStr.includes('emirates')) {
      return SUPPORTED_CURRENCIES.AED;
    }
    if (locStr.includes('singapore')) {
      return SUPPORTED_CURRENCIES.SGD;
    }
    if (locStr.includes('brazil') || locStr.includes('sao paulo')) {
      return SUPPORTED_CURRENCIES.BRL;
    }
    if (locStr.includes('mexico')) {
      return SUPPORTED_CURRENCIES.MXN;
    }
    if (locStr.includes('usa') || locStr.includes('us') || locStr.includes('united states') || locStr.includes('tx') || locStr.includes('ca') || locStr.includes('ny') || locStr.includes('fl') || locStr.includes('dallas') || locStr.includes('los angeles')) {
      return SUPPORTED_CURRENCIES.USD;
    }
  }

  // 2. Timezone detection
  try {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    if (timeZone.startsWith('Asia/Kolkata') || timeZone.startsWith('Asia/Calcutta')) {
      return SUPPORTED_CURRENCIES.INR;
    }
    if (timeZone.startsWith('Europe/London')) {
      return SUPPORTED_CURRENCIES.GBP;
    }
    if (timeZone.startsWith('Europe/')) {
      return SUPPORTED_CURRENCIES.EUR;
    }
    if (timeZone.startsWith('America/Toronto') || timeZone.startsWith('America/Vancouver') || timeZone.startsWith('America/Edmonton') || timeZone.startsWith('America/Winnipeg') || timeZone.startsWith('America/Halifax')) {
      return SUPPORTED_CURRENCIES.CAD;
    }
    if (timeZone.startsWith('Australia/')) {
      return SUPPORTED_CURRENCIES.AUD;
    }
    if (timeZone.startsWith('Asia/Tokyo')) {
      return SUPPORTED_CURRENCIES.JPY;
    }
    if (timeZone.startsWith('Asia/Dubai')) {
      return SUPPORTED_CURRENCIES.AED;
    }
    if (timeZone.startsWith('Asia/Singapore')) {
      return SUPPORTED_CURRENCIES.SGD;
    }
    if (timeZone.startsWith('America/Sao_Paulo')) {
      return SUPPORTED_CURRENCIES.BRL;
    }
    if (timeZone.startsWith('America/Mexico_City')) {
      return SUPPORTED_CURRENCIES.MXN;
    }
  } catch (e) {}

  // 3. Browser locale fallback
  try {
    const lang = typeof navigator !== 'undefined' ? (navigator.language || '') : '';
    if (lang.endsWith('-IN') || lang === 'hi') return SUPPORTED_CURRENCIES.INR;
    if (lang.endsWith('-GB')) return SUPPORTED_CURRENCIES.GBP;
    if (lang.endsWith('-CA')) return SUPPORTED_CURRENCIES.CAD;
    if (lang.endsWith('-AU')) return SUPPORTED_CURRENCIES.AUD;
    if (lang.endsWith('-JP') || lang === 'ja') return SUPPORTED_CURRENCIES.JPY;
    if (lang.endsWith('-AE') || lang === 'ar') return SUPPORTED_CURRENCIES.AED;
    if (lang.endsWith('-SG')) return SUPPORTED_CURRENCIES.SGD;
    if (lang.endsWith('-BR')) return SUPPORTED_CURRENCIES.BRL;
    if (lang.endsWith('-MX')) return SUPPORTED_CURRENCIES.MXN;
    if (['de', 'fr', 'es', 'it', 'nl', 'fi', 'pt-PT'].some(l => lang.startsWith(l))) return SUPPORTED_CURRENCIES.EUR;
  } catch (e) {}

  // 4. Default to USD ($2.99 / $29.90)
  return SUPPORTED_CURRENCIES.USD;
}

/**
 * Formats a numeric price amount into a localized currency string using browser's Intl.NumberFormat API.
 *
 * @param amount - The numerical amount to format (e.g., 2.99, 29.90)
 * @param currencyCode - The ISO 4217 currency code (e.g., 'USD', 'INR', 'EUR', 'GBP'). Defaults to detected user currency.
 * @param locale - Optional explicit BCP 47 language tag (e.g., 'en-US', 'en-IN'). Defaults to browser locale.
 * @returns Formatted currency string (e.g. "$2.99", "₹249.00", "€ 2,99")
 */
export function formatCurrency(
  amount: number,
  currencyCode?: string,
  locale?: string
): string {
  const code = (currencyCode || detectUserCurrency().code || 'USD').toUpperCase();
  const targetLocale = locale || (typeof navigator !== 'undefined' ? navigator.language : 'en-US');

  try {
    return new Intl.NumberFormat(targetLocale, {
      style: 'currency',
      currency: code,
      minimumFractionDigits: (code === 'JPY' || Number.isInteger(amount)) ? 0 : 2,
      maximumFractionDigits: code === 'JPY' ? 0 : 2,
    }).format(amount);
  } catch (e) {
    // Fallback if Intl.NumberFormat fails
    const symbol = SUPPORTED_CURRENCIES[code]?.symbol || '$';
    return `${symbol}${amount.toFixed(2)}`;
  }
}

