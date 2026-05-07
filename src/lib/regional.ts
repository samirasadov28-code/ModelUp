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
 */

import type {
  Currency,
  CurrencyCode,
  FundingStage,
  Geography,
  TaxJurisdiction,
} from "./types";

const CURRENCIES: Record<CurrencyCode, Currency> = {
  USD: { code: "USD", symbol: "$",  locale: "en-US" },
  GBP: { code: "GBP", symbol: "£",  locale: "en-GB" },
  EUR: { code: "EUR", symbol: "€",  locale: "en-IE" },
  CAD: { code: "CAD", symbol: "C$", locale: "en-CA" },
  AUD: { code: "AUD", symbol: "A$", locale: "en-AU" },
  SGD: { code: "SGD", symbol: "S$", locale: "en-SG" },
  INR: { code: "INR", symbol: "₹",  locale: "en-IN" },
  AED: { code: "AED", symbol: "AED ", locale: "en-AE" },
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
  canada: "CAD",
  australia: "AUD",
  singapore: "SGD",
  india: "INR",
  uae: "AED",
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
  us: 0.26,         // 21% federal + ~5% blended state
  uk: 0.25,         // 25% main rate
  ireland: 0.125,   // 12.5% trading income
  germany: 0.30,    // ~30% combined corporate + trade
  france: 0.25,     // 25% standard
  netherlands: 0.258, // 25.8% standard (2024)
  canada: 0.265,    // ~26.5% combined federal + provincial
  australia: 0.30,  // 30% (25% small-business)
  singapore: 0.17,  // 17% headline
  india: 0.252,     // 22% + 10% surcharge + 4% cess ≈ 25.17%
  uae: 0.09,        // 9% (introduced 2023, > AED 375k profit)
  other: 0.20,      // 20% global average
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

// Discount/premium vs the US baseline. EU/UK rounds typically price tighter
// on revenue multiples than US comparables; APAC slightly tighter still.
const JURISDICTION_MULTIPLE_FACTOR: Record<TaxJurisdiction, number> = {
  us: 1.0,
  uk: 0.85,
  ireland: 0.85,
  germany: 0.8,
  france: 0.8,
  netherlands: 0.85,
  canada: 0.9,
  australia: 0.85,
  singapore: 0.85,
  india: 0.75,
  uae: 0.85,
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
  canada: "Canada",
  australia: "Australia",
  singapore: "Singapore",
  india: "India",
  uae: "United Arab Emirates",
  other: "Other / Not sure",
};

export const TAX_JURISDICTION_FLAGS: Record<TaxJurisdiction, string> = {
  us: "🇺🇸",
  uk: "🇬🇧",
  ireland: "🇮🇪",
  germany: "🇩🇪",
  france: "🇫🇷",
  netherlands: "🇳🇱",
  canada: "🇨🇦",
  australia: "🇦🇺",
  singapore: "🇸🇬",
  india: "🇮🇳",
  uae: "🇦🇪",
  other: "🌍",
};

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
