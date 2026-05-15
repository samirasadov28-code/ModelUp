/**
 * English source dictionary. All other locale files mirror these keys.
 * Keep keys grouped by surface area so missing translations are easy to find.
 */

export const en = {
  // ── Navigation ─────────────────────────────────────────────────────────
  "nav.pricing": "Pricing",
  "nav.build_model": "Build your model",
  "nav.signin": "Sign in",
  "nav.free": "Free",
  "nav.pro": "Pro",
  "nav.view_free": "Free",
  "nav.view_pro": "Pro",

  // ── Landing page hero ──────────────────────────────────────────────────
  "hero.pill": "AI-powered financial modeling",
  "hero.headline_a": "The AI co-pilot for",
  "hero.headline_b": "founder financials",
  "hero.subcopy":
    "Describe your startup in a sentence. Our AI infers your business model, pricing, churn, and burn — and generates a defensible 5-year financial model, valuation, and investor narrative in 30 seconds.",
  "hero.cta_primary": "Build your model — it's free",
  "hero.cta_secondary": "See pricing",
  "hero.disclaimer": "No signup required · Free preview always available",

  // ── How it works ───────────────────────────────────────────────────────
  "how.badge": "Powered by AI",
  "how.title": "From a sentence to an investor-ready model in minutes",
  "how.subtitle":
    "The AI reads your description, infers industry-appropriate assumptions, and builds the entire model so you only review & tweak — never start from a blank spreadsheet.",
  "how.step1_title": "Describe your startup",
  "how.step1_desc":
    "One sentence is enough. Our AI infers your business model, pricing tiers, churn, CAC, burn, jurisdiction, and raise — then pre-fills every question.",
  "how.step2_title": "AI builds your model",
  "how.step2_desc":
    "5-year P&L, cash flow statement, sources & uses, unit economics, DCF + EBITDA-multiple valuation, cap table, and an AI-written funding narrative — in seconds.",
  "how.step3_title": "Pitch with confidence",
  "how.step3_desc":
    "Live AI chat answers any what-if. Download a formula-driven Excel investors can interrogate. Walk into the room with data, not guesses.",

  // ── Common UI ──────────────────────────────────────────────────────────
  "common.next": "Next",
  "common.back": "Back",
  "common.skip": "Skip",
  "common.cancel": "Cancel",
  "common.continue": "Continue",
  "common.loading": "Loading…",
  "common.error_generic": "Something went wrong. Please try again.",
  "common.get_pro": "Get Pro — $4.99/mo",
  "common.open_full_model": "Open full model",
  "common.download_excel": "Download Excel",
  "common.try_example": "Try an example",
  "common.language": "Language",
} as const;

export type DictKey = keyof typeof en;
export type Dict = Record<DictKey, string>;
