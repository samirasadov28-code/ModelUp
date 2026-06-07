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
  "nav.other_products": "Explore our other products",

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
  "q5.volume_growth_hint": "% per month (compounded) — leave blank or 0 to use your Q9 growth scenario as annual",
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
  "q7.opt_none": "0% — no churn",
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

  // ── Full-model page tabs ───────────────────────────────────────────────
  "tab.overview": "Overview",
  "tab.pl": "P&L",
  "tab.cash_flow": "Cash Flow",
  "tab.sources_uses": "Sources & Uses",
  "tab.unit_econ": "Unit Economics",
  "tab.scenarios": "Scenarios",
  "tab.cap_table": "Cap Table",
  "tab.valuation": "Valuation",
  "tab.sensitivity": "Sensitivity",
  "tab.calculations": "Calculations",

  // ── Output pages — common labels (preview + full) ──────────────────────
  "pg.year_n_arr": "Year {n} ARR",
  "pg.year_n_customers": "Year {n} Customers",
  "pg.annual_recurring_revenue": "Annual recurring revenue",
  "pg.cash_runway": "Cash Runway",
  "pg.runway": "Runway",
  "pg.raise_label": "Raise: {amount}",
  "pg.break_even": "Break-even (EBITDA+)",
  "pg.break_even_sub": "Month {month}",
  "pg.break_even_not_reached": "Not reached in forecast",
  "pg.first_profit_year": "First profitable year",
  "pg.first_profit_sub": "Annual net income > 0",
  "pg.ltv_cac": "LTV / CAC",
  "pg.ltv_cac_healthy": "Healthy ratio",
  "pg.ltv_cac_monitor": "Monitor closely",
  "pg.dcf_ev": "DCF enterprise value",
  "pg.dcf_at_rate": "@ {rate}% discount",
  "pg.ebitda_mult_value": "EBITDA multiple value",
  "pg.year_arr_label": "{label} ARR",
  "pg.year_ebitda_label": "{label} EBITDA",
  "pg.year_paying_customers": "Paying customers (EoY)",
  "pg.years_model_title": "{company} — {years}-Year Financial Model",
  "pg.generated_on": "Source: {source} · Generated {date}",
  "pg.excel_note": "Open Excel file in Excel or Google Sheets to auto-calculate formulas.",
  "pg.exporting": "Exporting…",
  "pg.download_xlsx": "Download .xlsx",
  "pg.excel_ready": "Excel model ready for download.",
  "pg.excel_ready_body":
    "The populated {source} file includes all your inputs injected into the Scen sheet. Open in Excel or Google Sheets to auto-calculate every formula.",

  // ── Preview page-specific ──────────────────────────────────────────────
  "preview.free_preview_badge": "Free Preview",
  "preview.cash_runway_text":
    "At a monthly burn of {burn}, your {raise} raise gives you {runway} of runway.",
  "preview.pl_summary_title": "5-Year P&L Summary",
  "preview.pl_summary_sub": "Annual projections · {growth} growth scenario",
  "preview.unit_econ_title": "Unit Economics",
  "preview.unit_econ_sub": "CAC · LTV · Payback period",
  "preview.pro_only_badge": "Pro only",
  "preview.upgrade_title": "Unlock your full financial model",
  "preview.upgrade_body":
    "Interactive charts, unit economics, funding narrative, scenario comparison, cap table, every formula plugged in with your numbers, and the populated Excel file.",
  "preview.upgrade_cancel": "Cancel anytime · No commitment",
  "preview.upgrade_see_included": "See what's included →",
  "preview.sources_uses_title": "Sources & Uses",
  "preview.sources_uses_sub":
    "Where the capital comes from and where it goes — drawn from your Q10 allocation.",

  // ── Full-model page-specific ───────────────────────────────────────────
  "full.full_model_pro": "Full Model — Pro",
  "full.ai_insights_label": "AI Model Insights",
  "full.income_statement": "Income Statement",
  "full.income_statement_sub": "{years}-year annual projections · {growth} scenario",
  "full.unit_econ_title": "Unit Economics",
  "full.unit_econ_sub": "Core metrics for business health and investor readiness",
  "full.scenarios_title": "Scenario Comparison",
  "full.scenarios_sub": "Conservative vs Base vs Aggressive across key metrics",
  "full.cap_table_title": "Cap Table",
  "full.cap_table_sub": "Pre / post-raise ownership for this round.",
  "full.waterfall_title": "Multi-round dilution waterfall",
  "full.waterfall_sub":
    "Edit pre-seed splits and projected future rounds — the table below shows founder dilution at each stage including ESOP refreshes.",
  "full.valuation_title": "Valuation (DCF)",
  "full.valuation_sub":
    "Build your discount rate from CAPM + cost of debt, then see year-by-year DCF and a sensitivity matrix across WACC × terminal growth.",
  "full.pro_wacc_title": "Pro WACC build-up",
  "full.pro_wacc_sub":
    "Refine the discount rate from CAPM + cost of debt; the DCF table and sensitivity matrix below recompute live.",
  "full.sensitivity_title": "Sensitivity analysis",
  "full.sensitivity_sub":
    "Stress-test every input — burn, CAC, churn, pricing, growth, runway — and see live impact on Year-3 ARR, EBITDA, runway, and unit economics.",
  "full.calculations_title": "Calculations",
  "full.calculations_sub": "Every formula behind the model, with your inputs plugged in",
  "full.cash_flow_title": "Cash Flow Statement",
  "full.cash_flow_sub":
    "Indirect method · {years} years · operating + investing + financing",
  "full.sources_uses_sub":
    "Capital coming in versus capital going out — pulled straight from your Q10 allocation. Must balance.",

  // ── Pricing page ───────────────────────────────────────────────────────
  "pricing.headline_a": "Simple pricing.",
  "pricing.headline_b": "Built for founders.",
  "pricing.subheadline":
    "Start free. Upgrade when you need the full model, charts, scenarios, and Excel download.",
  "pricing.free_title": "Free",
  "pricing.free_subtitle": "Forever, no card required",
  "pricing.pro_title": "Pro",
  "pricing.pro_subtitle": "Everything Free, plus the full model",
  "pricing.pro_price_per_mo": "/mo",
  "pricing.cta_free": "Start free",
  "pricing.cta_pro": "Get Pro",
  "pricing.cancel_anytime": "Cancel anytime",
  "pricing.faq_title": "Frequently asked",

  // ── PLTable (P&L tab) ──────────────────────────────────────────────────
  "pl.metric": "Metric",
  "pl.revenue": "Revenue",
  "pl.cogs": "Cost of Revenue",
  "pl.gross_profit": "Gross Profit",
  "pl.gross_margin_pct": "Gross Margin %",
  "pl.opex": "Operating Expenses",
  "pl.ebitda": "EBITDA",
  "pl.ebitda_margin_pct": "EBITDA Margin %",
  "pl.net_income": "Net Income",
  "pl.operational_kpis": "Operational KPIs",
  "pl.paying_customers_eop": "Paying Customers (EOP)",
  "pl.arr_yoe": "ARR (Year-end)",

  // ── CashFlowStatementTable ─────────────────────────────────────────────
  "cf.line_item": "Line item",
  "cf.net_income_post_tax": "Net income (post-tax)",
  "cf.plus_da": "+ D&A",
  "cf.plus_wc": "+ Working-capital changes",
  "cf.cash_from_ops": "Cash from operations",
  "cf.capex": "CapEx",
  "cf.cash_from_investing": "Cash from investing",
  "cf.equity_raised": "Equity raised",
  "cf.debt_raised": "Debt raised",
  "cf.cash_from_financing": "Cash from financing",
  "cf.net_change_in_cash": "Net change in cash",
  "cf.beginning_cash": "Beginning cash",
  "cf.ending_cash": "Ending cash",

  // ── SourcesAndUsesTable ────────────────────────────────────────────────
  "su.sources_title": "Sources",
  "su.sources_sub": "Where the capital comes from",
  "su.uses_title": "Uses",
  "su.uses_sub": "Where the capital goes (from your Q10 allocation)",
  "su.col_source": "Source",
  "su.col_use": "Use",
  "su.col_amount": "Amount",
  "su.col_percent": "%",
  "su.total_sources": "Total sources",
  "su.total_uses": "Total uses",
  "su.balanced": "Sources and Uses balance.",
  "su.unbalanced": "Sources and Uses differ by {delta} — check Q10 allocations.",

  // ── ValuationCard ──────────────────────────────────────────────────────
  "val.title": "Valuation",
  "val.subtitle":
    "DCF and comps-based EBITDA multiple — two independent anchors so you can triangulate.",
  "val.dcf_intrinsic": "DCF (intrinsic)",
  "val.enterprise_value": "Enterprise value",
  "val.discount_rate": "Discount rate",
  "val.terminal_growth": "Terminal growth",
  "val.pv_of_fcf": "PV of FCF",
  "val.pv_of_terminal": "PV of terminal",
  "val.ebitda_mult_comps": "EBITDA multiple (comps)",
  "val.revenue_mult_comps": "Revenue multiple (comps)",
  "val.mult_low": "Low ({mult}×)",
  "val.mult_base": "Base ({mult}×)",
  "val.mult_high": "High ({mult}×)",
  "val.times_mult_basis": "{label} × {mult}× ({basis})",
  "val.basis_ebitda": "EBITDA mult.",
  "val.basis_revenue": "ARR mult.",

  // ── CapTableSummary ────────────────────────────────────────────────────
  "ct.pre_money_valuation": "Pre-money Valuation",
  "ct.raise_amount": "Raise Amount",
  "ct.post_money_valuation": "Post-money Valuation",
  "ct.col_shareholder": "Shareholder",
  "ct.col_shares_pre": "Shares (pre)",
  "ct.col_ownership_pre": "Ownership (pre)",
  "ct.col_shares_post": "Shares (post)",
  "ct.col_ownership_post": "Ownership (post)",
  "ct.price_per_share_note":
    "Price per share: {price} · Based on {pct} new equity",
  "ct.founders": "Founders",
  "ct.new_investors": "New Investors",

  // ── UnitEconomicsDashboard ─────────────────────────────────────────────
  "ue.cac_label": "Customer Acquisition Cost",
  "ue.cac_sub": "All-in cost per new customer",
  "ue.ltv_label": "Lifetime Value",
  "ue.ltv_sub": "Based on {gm}% gross margin",
  "ue.ltv_cac_label": "LTV / CAC Ratio",
  "ue.ltv_cac_healthy": "Healthy — investors will like this",
  "ue.ltv_cac_acceptable": "Acceptable — room to improve",
  "ue.ltv_cac_needs_work": "Needs work — LTV is below CAC",
  "ue.payback_label": "Payback Period",
  "ue.payback_value": "{months} months",
  "ue.payback_sub": "Time to recover CAC from margin",
  "ue.blended_arpu": "Blended ARPU",
  "ue.blended_arpu_per_month": "/month",
  "ue.blended_arpu_sub": "Weighted average across all pricing tiers",
  "ue.pro_only": "Pro only",

  // ── ScenarioComparison ─────────────────────────────────────────────────
  "sc.conservative": "Conservative",
  "sc.base": "Base",
  "sc.aggressive": "Aggressive",
  "sc.selected": "Selected",
  "sc.revenue_y1": "Revenue Y1",
  "sc.revenue_y2": "Revenue Y2",
  "sc.revenue_last": "Revenue (last year)",
  "sc.arr_last": "ARR (end of last year)",
  "sc.ebitda_last": "EBITDA (last year)",
  "sc.customers_last": "Customers (last year)",
  "sc.runway_label": "Runway",

  // ── SensitivityAnalysis (sliders + metric cards) ───────────────────────
  "sens.intro_title": "Stress-test every input",
  "sens.intro_body":
    "Drag any slider to see how Year-3 ARR, EBITDA, runway, and unit economics respond. The financial engine recomputes live across all 36 months and three scenarios. Your saved base case is unchanged.",
  "sens.live_impact": "Live impact on Year-3 outputs",
  "sens.slider_monthly_burn": "Monthly burn",
  "sens.slider_monthly_burn_hint": "All-in cash spend per month",
  "sens.slider_cac": "CAC",
  "sens.slider_cac_hint": "Cost to acquire a single paying customer",
  "sens.slider_churn": "Monthly churn",
  "sens.slider_churn_hint": "% of customers cancelling each month",
  "sens.slider_year1_target": "Year 1 customer target",
  "sens.slider_year1_target_hint": "End of year 1 paying customers",
  "sens.slider_funding_ask": "Funding ask",
  "sens.slider_funding_ask_hint": "Capital raised in this round",
  "sens.slider_arpu_mult": "Pricing (ARPU multiplier)",
  "sens.slider_arpu_mult_hint": "Scales every tier price up or down",
  "sens.slider_cogs_adj": "COGS adjustment",
  "sens.slider_cogs_adj_hint": "Adds/subtracts percentage points to COGS rate",
  "sens.growth_scenario_card": "Growth scenario",
  "sens.growth_scenario_hint":
    "Conservative ≈ 4%/mo, Base ≈ 9%/mo, Aggressive ≈ 18%/mo.",
  "sens.base_label": "base:",
  "sens.delta_vs_base": "vs base",
  "sens.what_this_tells": "What this tells you",
  "sens.what_this_body":
    "The most sensitive levers in your model are usually monthly churn and pricing (they compound monthly). A 1pp churn change can swing Year-3 ARR by 20%+. Burn and funding ask move runway directly. CAC primarily moves the LTV/CAC ratio and payback. Use the sliders above to find your model's break points.",

  // ── ProUpsell card text (one per question + Q3 + Q5) ───────────────────
  "ups.q1_head": "Industry-tuned cost-of-revenue benchmarks",
  "ups.q1_body":
    "Pro picks the right COGS curve for your category — vertical SaaS, hardware, fintech, marketplaces — instead of the blended industry default.",
  "ups.q2_head": "Cohort-level retention curves for B2B vs B2C",
  "ups.q2_body":
    "Pro models enterprise vs SMB vs consumer cohorts separately — different churn, ACV, and payback by segment instead of one blended curve.",
  "ups.q3_head": "Region-aware payroll loading & state-level tax precision",
  "ups.q3_body":
    "Pro adds employer NI / FICA / payroll burden to your monthly burn and lets you pick state-level (Delaware vs CA) or canton-level (Zug vs Zurich) corporate-tax precision.",
  "ups.q4_head": "Stage-blended valuation comparables",
  "ups.q4_body":
    "Pro pulls fresh seed / A / B revenue multiples by industry & geography from PitchBook-style comps — not a single static stage multiple.",
  "ups.q5_head": "Per-tier churn, expansion revenue & dynamic unit pricing",
  "ups.q5_body":
    "Pro models tier-level churn / upgrades, ramping unit prices over time, and segmented production lines (multiple SKUs with their own cost & volume curves).",
  "ups.q6_head": "Per-channel CAC, conversion, and payback curves",
  "ups.q6_body":
    "Pro lets you split CAC by channel — paid ads, sales, partnerships — each with its own conversion rate, ramp, and payback so you can see which channel actually scales.",
  "ups.q7_head": "Cohort-based churn that decays over time",
  "ups.q7_body":
    "Pro models month-1 churn separately from steady-state churn (early customers churn 3-5× more) so the LTV math actually matches reality.",
  "ups.q8_head": "Headcount-driven burn with hiring plan",
  "ups.q8_body":
    "Pro builds your burn from a roles-and-salaries hiring plan (engineer, AE, designer) with employer payroll loading by jurisdiction — not a flat monthly figure that drifts.",
  "ups.q9_head": "S-curve growth with TAM ceiling",
  "ups.q9_body":
    "Pro replaces flat monthly growth with an S-curve that decelerates as you approach your TAM — what investors actually expect for top-down sanity checks.",
  "ups.q10_head": "Dilution waterfall across multiple rounds",
  "ups.q10_body":
    "Pro models seed → A → B in sequence — option-pool refresh, ESOP top-ups, secondary — so you can see founder dilution at exit, not just after this round.",
  "ups.q11_head": "Full WACC build-up: cost of equity (CAPM) + cost of debt × tax shield",
  "ups.q11_body":
    "Pro lets you set risk-free rate, beta, equity risk premium, cost of debt and debt/equity weights to refine this discount rate, plus a full DCF valuation table with sensitivity bands.",
  "ups.pro_prefix": "Pro:",
  "ups.see_features": "See Pro features",

  // ── /model/new wrapper ───────────────────────────────────────────────
  "newpage.title": "Build your financial model",
  "newpage.subtitle":
    "Answer a few questions about your business. We'll generate a professional-grade 5-year financial model in seconds.",

  // ── OptionCard descriptions (Q1, Q2, Q4, Q5, Q7, Q9) ─────────────────
  "q1.desc_saas": "Software charged monthly or annually",
  "q1.desc_marketplace": "Connecting buyers and sellers, taking a cut",
  "q1.desc_product": "Physical or digital product for purchase",
  "q1.desc_service": "Retainer or project-based professional services",
  "q1.desc_other": "Infrastructure, cleantech, hardware, etc.",
  "q2.desc_b2b": "Sell to companies, teams, or enterprises",
  "q2.desc_b2c": "Sell directly to individual users",
  "q2.desc_both": "Mixed customer base",
  "q4.desc_pre_seed": "Idea or MVP stage, raising your first capital",
  "q4.desc_seed": "Early traction, building the team",
  "q4.desc_series_a": "Proven product-market fit, scaling",
  "q4.desc_series_b": "Scaling fast, expanding markets",
  "q5.desc_subscription": "Users × tier prices",
  "q5.desc_production": "Units × unit price",
  "q5.desc_hybrid": "Both",
  "q7.desc_none": "No customers ever cancel (e.g. one-off or perpetual)",
  "q7.desc_lt2": "Excellent — enterprise-grade retention",
  "q7.desc_2to5": "Good — typical for well-optimised SaaS",
  "q7.desc_5to10": "Room for improvement — review onboarding",
  "q7.desc_gt10": "High — investigate product-market fit",
  "q7.desc_unknown": "We'll use 5% as a baseline",
  "q9.desc_conservative": "~4% monthly growth — realistic, defensible to investors",
  "q9.desc_base": "~9% monthly growth — solid execution, strong market",
  "q9.desc_aggressive": "~18% monthly growth — high-conviction, viral or paid-heavy",
  "q11.desc_mature": "WACC-driven, low risk",
  "q11.desc_established": "Series B+ / late stage",
  "q11.desc_series_a": "Proven PMF, scaling",
  "q11.desc_seed": "Early traction",
  "q11.desc_pre_seed": "Idea or MVP",
  "q11.desc_venture": "High-risk early bet",

  // ── Pricing page feature lists ───────────────────────────────────────
  "pricing.free_feat_1": "5-year P&L summary table",
  "pricing.free_feat_2": "Cash runway calculation",
  "pricing.free_feat_3": "Break-even year",
  "pricing.free_feat_4": "Model generated in seconds",
  "pricing.pro_feat_1": "Everything in Free",
  "pricing.pro_feat_2": "Interactive revenue & EBITDA charts",
  "pricing.pro_feat_3": "Cash runway area chart",
  "pricing.pro_feat_4": "Unit economics dashboard (CAC, LTV, LTV/CAC, payback)",
  "pricing.pro_feat_5": "Funding ask narrative (investor-ready paragraph)",
  "pricing.pro_feat_6": "3-scenario comparison (Base / Conservative / Aggressive)",
  "pricing.pro_feat_7": "Cap table with pre/post-raise ownership",
  "pricing.pro_feat_8": "Calculations panel — every formula with your numbers",
  "pricing.pro_feat_9": "Populated Excel model download (.xlsx)",
  "pricing.pro_feat_10": "Unlimited models",

  // ── ChatWidget UI ────────────────────────────────────────────────────
  "chat.button": "Chat",
  "chat.button_with_model": "Ask the model",
  "chat.header_with_model": "Ask about {name}",
  "chat.header_default": "Ask the ModelUp assistant",
  "chat.subtitle_model": "Powered by Groq · uses your actual numbers",
  "chat.subtitle_default": "Powered by Groq · Llama 3.3 70B",
  "chat.intro_with_model":
    "I'm looking at your model now. Ask anything — runway, scenarios, what investors will push back on, what to fix first.",
  "chat.intro_default":
    "Hi! I can help you understand ModelUp or answer general financial-modelling questions. Build a model first and I'll be able to reason about your specific numbers.",
  "chat.placeholder_with_model": "Ask about your model…",
  "chat.placeholder_default": "Ask anything about ModelUp…",
  "chat.your_model_fallback": "your model",
  "chat.suggest_model_1": "What's my biggest financial risk?",
  "chat.suggest_model_2": "Is my LTV/CAC ratio healthy?",
  "chat.suggest_model_3": "What if I doubled my CAC — how does runway change?",
  "chat.suggest_model_4": "Explain my Year-3 EBITDA in plain English.",
  "chat.suggest_general_1": "What does ModelUp do?",
  "chat.suggest_general_2": "What's the difference between Free and Pro?",
  "chat.suggest_general_3": "How do I think about CAC vs LTV?",
  "chat.suggest_general_4": "How do investors evaluate my runway?",

  // ── ProValuationPanel ───────────────────────────────────────────────
  "pv.intro_title": "Build your discount rate from first principles",
  "pv.intro_body":
    "Cost of equity uses CAPM: rE = rf + β × ERP. WACC blends in the after-tax cost of debt by capital weight: WACC = E/V × rE + D/V × rD × (1−t). Edit any input and the DCF below recomputes live.",
  "pv.in_rf": "Risk-free rate",
  "pv.in_rf_hint": "10-year govt bond yield in your reporting currency. US ~4.5%, UK ~4%, EU ~2.5%.",
  "pv.in_erp": "Equity risk premium",
  "pv.in_erp_hint": "Damodaran's developed-market average is ~5.5%; emerging markets +2–4pp.",
  "pv.in_beta": "Beta (β)",
  "pv.in_beta_hint": "Industry comp beta. SaaS ~1.2, marketplaces ~1.5, infra ~0.9, consumer apps ~1.4.",
  "pv.in_rd": "Cost of debt (pre-tax)",
  "pv.in_rd_hint": "What a bank charges your stage of company. Venture debt typically 9-13%.",
  "pv.in_dw": "Debt weight (D/V)",
  "pv.in_dw_hint": "Most early-stage SaaS is 100% equity-funded (0% debt). Hardware/PF often 20-40%.",
  "pv.in_g": "Terminal growth (g)",
  "pv.in_g_hint": "Long-run perpetuity growth. 2–3% is the standard developed-market range.",
  "pv.card_re": "Cost of equity (CAPM)",
  "pv.card_atcd": "After-tax cost of debt",
  "pv.card_wacc": "WACC",
  "pv.card_dcf_ev": "DCF enterprise value",
  "pv.card_dcf_ev_sub": "PV of FCF + PV of terminal value",
  "pv.dcf_table_title": "DCF table — year-by-year",
  "pv.col_year": "Year",
  "pv.col_fcf": "FCF (net income)",
  "pv.col_df": "Discount factor",
  "pv.col_pv": "Present value",
  "pv.year_n": "Year {n}",
  "pv.terminal_row": "Terminal value (Y{n}, growing at {g})",
  "pv.ev_row": "Enterprise value",
  "pv.sens_title": "Sensitivity — enterprise value at varied WACC and terminal growth",
  "pv.sens_body": "Rows: WACC ±2pp · Columns: terminal growth ±1pp. The centre cell is your base case.",
  "pv.sens_corner": "WACC \\ g",

  // ── ProCapTableWaterfall ────────────────────────────────────────────
  "wf.intro_title": "Pre-seed ownership + projected future rounds",
  "wf.intro_body":
    "Edit the pre-seed cap table on the left and the projected rounds on the right. The waterfall below shows founder dilution at each stage, including ESOP refreshes.",
  "wf.preseed_title": "Pre-seed cap table (before this round)",
  "wf.preseed_total": "Total: {total}%",
  "wf.preseed_total_warn": "(should be 100%)",
  "wf.add": "Add",
  "wf.remove": "Remove",
  "wf.holder_founder1": "Founder 1",
  "wf.holder_founder2": "Founder 2",
  "wf.holder_angels": "Pre-seed angels",
  "wf.holder_esop": "ESOP",
  "wf.holder_new": "New holder",
  "wf.future_title": "Projected future rounds",
  "wf.add_round": "Add round",
  "wf.round_name": "Round {n}",
  "wf.in_raise": "Raise",
  "wf.in_premoney": "Pre-money",
  "wf.in_esop": "ESOP top-up %",
  "wf.postmoney_note": "Post-money: {post} · New investor equity: {pct}",
  "wf.waterfall_title": "Dilution waterfall — ownership at each stage",
  "wf.col_stage": "Stage",
  "wf.col_premoney": "Pre-money",
  "wf.col_raise": "Raise",
  "wf.col_postmoney": "Post-money",
  "wf.col_new_equity": "New equity",
  "wf.stage_preseed": "Pre-seed (today)",
  "wf.stage_this_round": "This round ({stage})",
  "wf.this_round_investors": "This round investors",
  "wf.round_investors": "{name} investors",
  "wf.footer_note":
    "Pre-seed splits normalise to 100%. Each future round dilutes existing holders pro-rata after the ESOP refresh; new investors receive raise / post-money.",

  // ── CalculationsPanel ───────────────────────────────────────────────
  "calc.intro_title": "How every number is calculated",
  "calc.intro_body": "Each section shows the formula, the values from your inputs, and the result. Click a heading to collapse it. Want to change inputs?",
  "calc.intro_cta": "Build a new model and the formulas will recompute live.",
  "calc.sec_growth_title": "Customer growth",
  "calc.sec_growth_desc": "How customer counts move month over month",
  "calc.sec_revenue_title": "Revenue, COGS, gross profit",
  "calc.sec_revenue_desc": "From customers to gross profit each month",
  "calc.sec_opex_title": "OpEx, EBITDA, net income",
  "calc.sec_opex_desc": "From gross profit to bottom line",
  "calc.sec_ue_title": "Unit economics",
  "calc.sec_ue_desc": "CAC, LTV, payback, LTV/CAC",
  "calc.sec_runway_title": "Runway & break-even",
  "calc.sec_runway_desc": "When you run out, when EBITDA turns positive",
  "calc.sec_captable_title": "Cap table & valuation",
  "calc.sec_captable_desc": "Pre-money, post-money, dilution",

  // ── Common labels used across components ────────────────────────────
  "common.reset_btn": "Reset",

  // ── Tour / onboarding coachmarks ─────────────────────────────────────
  "tour.next": "Next",
  "tour.done": "Got it",
  "tour.skip": "Skip",
  "tour.step": "Step {current} of {total}",
  "tour.full_sensitivity_title": "Stress-test every input",
  "tour.full_sensitivity_body":
    "Drag any slider — churn, CAC, pricing, burn — and the whole model recomputes live. The fastest way to find your break points.",
  "tour.full_valuation_title": "Triangulate your valuation",
  "tour.full_valuation_body":
    "DCF and comps-based multiples side-by-side. Pro adds a full WACC builder (CAPM + cost of debt × tax shield) and a sensitivity matrix.",
  "tour.full_captable_title": "Model dilution through Series B",
  "tour.full_captable_body":
    "Edit your pre-seed splits and project Series A/B with ESOP refreshes. The waterfall shows founder ownership at every stage.",
  "tour.full_calc_title": "Every number, every formula",
  "tour.full_calc_body":
    "Six expandable sections show how each metric was computed — useful when investors ask exactly how you got to Year-3 ARR.",
} as const;

export type DictKey = keyof typeof en;
export type Dict = Record<DictKey, string>;
