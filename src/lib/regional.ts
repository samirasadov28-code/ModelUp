/**
 * Regional defaults — currency mapping, corporate tax rates, and stage-based
 * valuation multiples by jurisdiction. Engines, the suggest API, and Excel
 * exports all read from here so a single change propagates everywhere.
 *
 * Notes:
 *  • Tax rates are blended/effective approximations for early-stage planning,
 *    not legal advice. They include reasonable state/cantonal/local layers.
 *  • Valuation multiples are blended Y1 ARR multiples observed in seed/A/B
 *    rounds; tweak by stage with `valuationMultipleForStage`.
 *  • The four "free" jurisdictions cover ~70% of founders we expect; the rest
 *    are gated behind Pro so we have a tangible upgrade reason on Q3.
 */

import type {
  Currency,
  CurrencyCode,
  FundingStage,
  Geography,
  TaxJurisdiction,
} from "./types";

const CURRENCIES: Record<CurrencyCode, Currency> = {
  USD: { code: "USD", symbol: "$",   locale: "en-US" },
  GBP: { code: "GBP", symbol: "£",   locale: "en-GB" },
  EUR: { code: "EUR", symbol: "€",   locale: "en-IE" },
  CAD: { code: "CAD", symbol: "C$",  locale: "en-CA" },
  AUD: { code: "AUD", symbol: "A$",  locale: "en-AU" },
  NZD: { code: "NZD", symbol: "NZ$", locale: "en-NZ" },
  SGD: { code: "SGD", symbol: "S$",  locale: "en-SG" },
  HKD: { code: "HKD", symbol: "HK$", locale: "en-HK" },
  JPY: { code: "JPY", symbol: "¥",   locale: "ja-JP" },
  KRW: { code: "KRW", symbol: "₩",   locale: "ko-KR" },
  INR: { code: "INR", symbol: "₹",   locale: "en-IN" },
  IDR: { code: "IDR", symbol: "Rp",  locale: "id-ID" },
  AED: { code: "AED", symbol: "AED ", locale: "en-AE" },
  SAR: { code: "SAR", symbol: "SAR ", locale: "en-SA" },
  ILS: { code: "ILS", symbol: "₪",   locale: "en-IL" },
  BRL: { code: "BRL", symbol: "R$",  locale: "pt-BR" },
  MXN: { code: "MXN", symbol: "MX$", locale: "es-MX" },
  ARS: { code: "ARS", symbol: "AR$", locale: "es-AR" },
  ZAR: { code: "ZAR", symbol: "R",   locale: "en-ZA" },
  NGN: { code: "NGN", symbol: "₦",   locale: "en-NG" },
  CHF: { code: "CHF", symbol: "CHF ", locale: "de-CH" },
  SEK: { code: "SEK", symbol: "kr",  locale: "sv-SE" },
  NOK: { code: "NOK", symbol: "kr",  locale: "nb-NO" },
  DKK: { code: "DKK", symbol: "kr",  locale: "da-DK" },
};

export function currency(code: CurrencyCode): Currency {
  return CURRENCIES[code];
}

const GEOGRAPHY_TO_CURRENCY: Record<Geography, CurrencyCode> = {
  us: "USD",
  uk: "GBP",
  eu: "EUR",
  asia: "USD",
  global: "USD",
};

export function currencyForGeography(geo: Geography | undefined): Currency {
  return CURRENCIES[GEOGRAPHY_TO_CURRENCY[geo ?? "us"] ?? "USD"];
}

const JURISDICTION_TO_CURRENCY: Record<TaxJurisdiction, CurrencyCode> = {
  us: "USD",
  uk: "GBP",
  ireland: "EUR",
  germany: "EUR",
  france: "EUR",
  netherlands: "EUR",
  spain: "EUR",
  italy: "EUR",
  sweden: "SEK",
  switzerland: "CHF",
  estonia: "EUR",
  denmark: "DKK",
  norway: "NOK",
  canada: "CAD",
  australia: "AUD",
  "new-zealand": "NZD",
  singapore: "SGD",
  "hong-kong": "HKD",
  japan: "JPY",
  "south-korea": "KRW",
  india: "INR",
  indonesia: "IDR",
  uae: "AED",
  "saudi-arabia": "SAR",
  israel: "ILS",
  brazil: "BRL",
  mexico: "MXN",
  argentina: "ARS",
  "south-africa": "ZAR",
  nigeria: "NGN",
  other: "USD",
};

export function currencyForJurisdiction(j: TaxJurisdiction | undefined): Currency {
  return CURRENCIES[JURISDICTION_TO_CURRENCY[j ?? "us"] ?? "USD"];
}

/**
 * Pick the currency to display the model in. We prefer the founder's tax
 * jurisdiction (where they actually keep books), falling back to primary
 * market. This is what gets stored on `ModelOutputs.currency`.
 */
export function resolveCurrency(opts: {
  geography: Geography;
  taxJurisdiction?: TaxJurisdiction;
}): Currency {
  if (opts.taxJurisdiction && opts.taxJurisdiction !== "other") {
    return currencyForJurisdiction(opts.taxJurisdiction);
  }
  return currencyForGeography(opts.geography);
}

// ── Corporate tax rates (effective, blended) ───────────────────────────────

const TAX_RATES: Record<TaxJurisdiction, number> = {
  us: 0.26,           // 21% federal + ~5% blended state
  uk: 0.25,           // 25% main rate
  ireland: 0.125,     // 12.5% trading income
  germany: 0.30,      // ~30% combined corporate + trade
  france: 0.25,       // 25% standard
  netherlands: 0.258, // 25.8% standard (2024)
  spain: 0.25,
  italy: 0.24,        // IRES 24% + IRAP separately
  sweden: 0.206,      // 20.6%
  switzerland: 0.18,  // ~14–21% canton-blended
  estonia: 0.20,      // 20% on distributed profits
  denmark: 0.22,
  norway: 0.22,
  canada: 0.265,      // federal + provincial
  australia: 0.30,    // 30% (25% small-business)
  "new-zealand": 0.28,
  singapore: 0.17,
  "hong-kong": 0.165, // two-tier 8.25/16.5
  japan: 0.30,        // ~30% combined
  "south-korea": 0.24,
  india: 0.252,       // 22% + 10% + 4% cess
  indonesia: 0.22,
  uae: 0.09,
  "saudi-arabia": 0.20,
  israel: 0.23,
  brazil: 0.34,       // IRPJ 25 + CSLL 9
  mexico: 0.30,
  argentina: 0.35,
  "south-africa": 0.27,
  nigeria: 0.30,
  other: 0.20,
};

export function taxRateForJurisdiction(j: TaxJurisdiction | undefined): number {
  return TAX_RATES[j ?? "us"] ?? 0.20;
}

// ── Stage-based valuation multiples (Year-1 ARR) ───────────────────────────

const STAGE_BASE_MULTIPLE: Record<FundingStage, number> = {
  "pre-seed": 8,
  seed: 10,
  "series-a": 12,
  "series-b": 15,
};

// Discount/premium vs the US baseline. US is the most generous; EU/UK price
// tighter; emerging markets tighter still.
const JURISDICTION_MULTIPLE_FACTOR: Record<TaxJurisdiction, number> = {
  us: 1.0,
  uk: 0.85,
  ireland: 0.85,
  germany: 0.8,
  france: 0.8,
  netherlands: 0.85,
  spain: 0.75,
  italy: 0.75,
  sweden: 0.85,
  switzerland: 0.9,
  estonia: 0.8,
  denmark: 0.85,
  norway: 0.8,
  canada: 0.9,
  australia: 0.85,
  "new-zealand": 0.8,
  singapore: 0.9,
  "hong-kong": 0.85,
  japan: 0.85,
  "south-korea": 0.8,
  india: 0.75,
  indonesia: 0.7,
  uae: 0.85,
  "saudi-arabia": 0.75,
  israel: 0.95,
  brazil: 0.7,
  mexico: 0.7,
  argentina: 0.6,
  "south-africa": 0.65,
  nigeria: 0.6,
  other: 0.9,
};

export function valuationMultipleForStage(
  stage: FundingStage,
  j: TaxJurisdiction | undefined
): number {
  const base = STAGE_BASE_MULTIPLE[stage] ?? 10;
  const factor = JURISDICTION_MULTIPLE_FACTOR[j ?? "us"] ?? 1.0;
  return Math.round(base * factor * 10) / 10;
}

// ── Display helpers ────────────────────────────────────────────────────────

export const TAX_JURISDICTION_LABELS: Record<TaxJurisdiction, string> = {
  us: "United States",
  uk: "United Kingdom",
  ireland: "Ireland",
  germany: "Germany",
  france: "France",
  netherlands: "Netherlands",
  spain: "Spain",
  italy: "Italy",
  sweden: "Sweden",
  switzerland: "Switzerland",
  estonia: "Estonia",
  denmark: "Denmark",
  norway: "Norway",
  canada: "Canada",
  australia: "Australia",
  "new-zealand": "New Zealand",
  singapore: "Singapore",
  "hong-kong": "Hong Kong",
  japan: "Japan",
  "south-korea": "South Korea",
  india: "India",
  indonesia: "Indonesia",
  uae: "United Arab Emirates",
  "saudi-arabia": "Saudi Arabia",
  israel: "Israel",
  brazil: "Brazil",
  mexico: "Mexico",
  argentina: "Argentina",
  "south-africa": "South Africa",
  nigeria: "Nigeria",
  other: "Other / Not sure",
};

export const TAX_JURISDICTION_FLAGS: Record<TaxJurisdiction, string> = {
  us: "🇺🇸",
  uk: "🇬🇧",
  ireland: "🇮🇪",
  germany: "🇩🇪",
  france: "🇫🇷",
  netherlands: "🇳🇱",
  spain: "🇪🇸",
  italy: "🇮🇹",
  sweden: "🇸🇪",
  switzerland: "🇨🇭",
  estonia: "🇪🇪",
  denmark: "🇩🇰",
  norway: "🇳🇴",
  canada: "🇨🇦",
  australia: "🇦🇺",
  "new-zealand": "🇳🇿",
  singapore: "🇸🇬",
  "hong-kong": "🇭🇰",
  japan: "🇯🇵",
  "south-korea": "🇰🇷",
  india: "🇮🇳",
  indonesia: "🇮🇩",
  uae: "🇦🇪",
  "saudi-arabia": "🇸🇦",
  israel: "🇮🇱",
  brazil: "🇧🇷",
  mexico: "🇲🇽",
  argentina: "🇦🇷",
  "south-africa": "🇿🇦",
  nigeria: "🇳🇬",
  other: "🌍",
};

/**
 * Free tier — these four cover the vast majority of founders we onboard. The
 * rest are Pro-gated so the picker doubles as a Pro upsell.
 */
export const FREE_TAX_JURISDICTIONS: TaxJurisdiction[] = ["us", "uk", "ireland", "other"];

export const PRO_TAX_JURISDICTIONS: TaxJurisdiction[] = (
  Object.keys(TAX_JURISDICTION_LABELS) as TaxJurisdiction[]
).filter((j) => !FREE_TAX_JURISDICTIONS.includes(j));

export function isFreeJurisdiction(j: TaxJurisdiction | undefined): boolean {
  return !!j && FREE_TAX_JURISDICTIONS.includes(j);
}

/** Best-effort fallback when only `geography` is known. */
export function defaultJurisdictionForGeography(geo: Geography): TaxJurisdiction {
  switch (geo) {
    case "us":     return "us";
    case "uk":     return "uk";
    case "eu":     return "ireland"; // most popular EU corp tax base for tech
    case "asia":   return "singapore";
    case "global": return "us";
  }
}
