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
  "common.optional": "optional",
  "common.required": "required",
  "common.smart_start": "Smart start",
  "common.thinking": "Thinking…",
  "common.add": "Add",
  "common.remove": "Remove",
  "common.reset": "Reset",
  "common.step_of": "Step {current} of {total}",
  "common.generate_model": "Generate My Model →",

  // ── Questionnaire — intro (step 0) ─────────────────────────────────────
  "q0.intro_title": "Describe your startup in a few words",
  "q0.intro_subtitle":
    "One or two sentences is plenty. Our AI will pre-fill the next 10 questions with sensible defaults — your business model, customer type, pricing, burn, CAC, raise size and more — so you only review & tweak instead of typing from scratch.",
  "q0.your_description": "Your description",
  "q0.placeholder":
    "e.g. We're building a B2B SaaS platform that helps law firms automate contract review with AI. Charging $200/seat/month, targeting US mid-market firms. Raising a seed round.",
  "q0.get_smart_defaults": "Get smart defaults",
  "q0.skip_intro": "Skip — I'll fill it in myself",
  "q0.tip":
    "Tip: the more you say (pricing, market, stage, headcount), the better the defaults. We never share your description.",
  "q0.try_example_prefix": "Try an example:",
  "q0.ai_prefilled": "Pre-filled from your description.",
  "q0.review_each": "Review every step — you can edit anything.",
  "q0.error_too_short": "Tell us a bit more — at least one sentence.",
  "q0.error_suggest_failed": "AI suggestions failed",
  "q0.building_model": "Building your financial model…",
  "q0.running_projections": "Running projections across 3 scenarios",

  // ── Q1 — Business model ────────────────────────────────────────────────
  "q1.title": "What type of business are you building?",
  "q1.subtitle": "This determines which financial model we use as the foundation.",
  "q1.opt_saas": "SaaS / Subscription",
  "q1.opt_marketplace": "Marketplace",
  "q1.opt_product": "Product",
  "q1.opt_service": "Service / Agency",
  "q1.opt_other": "Other",

  // ── Q2 — Customer type ─────────────────────────────────────────────────
  "q2.title": "Who are your customers?",
  "q2.opt_b2b": "B2B — businesses",
  "q2.opt_b2c": "B2C — consumers",
  "q2.opt_both": "Both B2B and B2C",

  // ── Q3 — Geography + tax jurisdiction ──────────────────────────────────
  "q3.title": "Where do you operate?",
  "q3.subtitle":
    "Primary market drives currency and acquisition assumptions. Tax base drives corporate tax and valuation multiples.",
  "q3.primary_market": "Primary market",
  "q3.geo_us": "United States",
  "q3.geo_uk": "United Kingdom",
  "q3.geo_eu": "Europe (EU)",
  "q3.geo_asia": "Asia Pacific",
  "q3.geo_global": "Global / Multi-market",
  "q3.tax_base": "Tax base — where the company pays corporate tax",
  "q3.tax_base_help":
    "Drives the corporate-tax line in your P&L and the valuation multiple in the cap table.",

  // ── Q4 — Funding stage ─────────────────────────────────────────────────
  "q4.title": "What stage are you raising at?",
  "q4.subtitle": "This calibrates valuation assumptions and investor return expectations.",
  "q4.opt_pre_seed": "Pre-seed",
  "q4.opt_seed": "Seed",
  "q4.opt_series_a": "Series A",
  "q4.opt_series_b": "Series B+",

  // ── Q5 — Revenue model + pricing ───────────────────────────────────────
  "q5.title": "How do you make money?",
  "q5.subtitle":
    "Choose the primary revenue model. Subscription is users × tiers. Production is units × unit price. Hybrid runs both.",
  "q5.revenue_model": "Revenue model",
  "q5.rm_subscription": "Subscription",
  "q5.rm_production": "Production",
  "q5.rm_hybrid": "Hybrid",
  "q5.subscription_tiers": "Subscription tiers",
  "q5.tier_count": "Number of pricing tiers",
  "q5.tier_name": "Name",
  "q5.tier_price": "$/month",
  "q5.tier_alloc": "% of users",
  "q5.tier_locked": "Locked at 100% with one tier",
  "q5.allocation_total": "Allocation total:",
  "q5.allocation_warning": "(should total 100%)",
  "q5.production_section": "Production / unit economics",
  "q5.units_year1": "Units sold in year 1",
  "q5.volume_growth": "Monthly volume growth",
  "q5.unit_price": "Unit price",
  "q5.unit_cost": "Direct cost per unit",
  "q5.unit_cost_help": "Raw materials + direct labor",
  "q5.unit_margin": "Unit margin:",

  // ── Q6 — Acquisition + CAC ─────────────────────────────────────────────
  "q6.title": "How do you acquire customers?",
  "q6.subtitle": "Select all that apply, then tell us your cost to acquire a single customer.",
  "q6.ch_paid_ads": "Paid Ads",
  "q6.ch_seo": "SEO / Organic",
  "q6.ch_sales": "Sales Team",
  "q6.ch_partnerships": "Partnerships",
  "q6.ch_word_of_mouth": "Word of Mouth",
  "q6.ch_product_led": "Product-led",
  "q6.cac_label": "Estimated cost to acquire one customer (CAC)",
  "q6.cac_help": "All-in cost: ads spend + sales time + tools",
  "q6.acv_label": "Average annual contract value (ACV)",
  "q6.avg_spend_label": "Average monthly spend per consumer",

  // ── Q7 — Churn ─────────────────────────────────────────────────────────
  "q7.title": "What's your monthly churn rate?",
  "q7.subtitle": "The percentage of customers who cancel each month. Lower is better.",
  "q7.opt_lt2": "Less than 2%",
  "q7.opt_2to5": "2–5%",
  "q7.opt_5to10": "5–10%",
  "q7.opt_gt10": "Greater than 10%",
  "q7.opt_unknown": "Don't know yet",

  // ── Q8 — Team & costs ──────────────────────────────────────────────────
  "q8.title": "Tell us about your team and costs",
  "q8.headcount": "Current headcount",
  "q8.hc_1": "Just me (1)",
  "q8.hc_2_5": "2–5 people",
  "q8.hc_6_15": "6–15 people",
  "q8.hc_15_plus": "15+ people",
  "q8.monthly_burn": "Monthly burn rate — all costs today",
  "q8.burn_help": "Salaries, tools, office, cloud infra — everything",

  // ── Q9 — Growth ambition ───────────────────────────────────────────────
  "q9.title": "What's your growth ambition?",
  "q9.year1_target": "Year 1 customer / user target",
  "q9.year1_target_help": "Total paying customers at end of year one",
  "q9.units_target": "Year 1 production target (units)",
  "q9.units_target_help":
    "Total units shipped / produced across year one. Combined with the unit price & cost you entered on the revenue step, this drives Y1 revenue and direct cost.",
  "q9.growth_scenario": "Growth scenario",
  "q9.opt_conservative": "Conservative",
  "q9.opt_base": "Base case",
  "q9.opt_aggressive": "Aggressive",

  // ── Q10 — Raise ────────────────────────────────────────────────────────
  "q10.title": "Tell us about your raise",
  "q10.subtitle": "The final piece — we'll use this to calculate runway and returns.",
  "q10.raise_amount": "How much are you raising?",
  "q10.use_of_proceeds": "What will you use it for? (select all) — allocate % of the raise",
  "q10.uop_product_dev": "Product Development",
  "q10.uop_hiring": "Hiring",
  "q10.uop_marketing": "Marketing & Sales",
  "q10.uop_operations": "Operations",
  "q10.uop_working_capital": "Working Capital",
  "q10.uop_allocation": "Allocation across selected",
  "q10.target_runway": "Target runway from this raise",
  "q10.runway_months": "{months}mo",
  "q10.company_name": "Company name (optional)",

  // ── Q11 — Cost of capital ──────────────────────────────────────────────
  "q11.title": "What discount rate should we use?",
  "q11.subtitle":
    "This is the return investors demand from your stage of business. We'll use it to compute a DCF valuation from the 5-year forecast. Pro unlocks a full WACC build-up.",
  "q11.pick_preset": "Pick a preset",
  "q11.preset_mature": "Mature / public-comp",
  "q11.preset_established": "Established growth",
  "q11.preset_series_a": "Series A",
  "q11.preset_seed": "Seed",
  "q11.preset_pre_seed": "Pre-seed / early",
  "q11.preset_venture": "Venture / deep-tech",
  "q11.custom_rate": "Or set your own (%)",
  "q11.terminal_growth": "Terminal growth rate (long-term, %)",
} as const;

export type DictKey = keyof typeof en;
export type Dict = Record<DictKey, string>;
