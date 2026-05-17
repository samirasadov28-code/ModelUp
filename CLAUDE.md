# ModelUp — assistant working notes

## Workflow

**Always deploy and merge after finishing a piece of work.** Don't stop at "branch pushed."
The full loop is:

1. Commit on the working branch.
2. `git push -u origin <branch>`.
3. Open a PR via `mcp__github__create_pull_request` against `claude/build-modelup-app-6Mfvy`
   (this repo has no `main`/`master` — that branch is the de-facto baseline; the merge-commit
   history confirms it: every release lands as `merge claude/<topic> into baseline (vX.Y.Z)`).
4. Merge it via `mcp__github__merge_pull_request` with `merge_method: "merge"` and a commit
   title matching the existing pattern: `merge claude/<topic> into baseline (vX.Y.Z)`.
5. Netlify auto-deploys from the push to baseline (see `netlify.toml` — `@netlify/plugin-nextjs`,
   build command `npm run build`). No separate deploy step is needed.

Bump **both** version files to match the release tag in the PR title (e.g. v1.7.0):

- `package.json` → `"version"` field.
- `src/lib/version.ts` → `APP_VERSION` constant. **This is the version the UI displays**
  (footer of `src/app/page.tsx` via `VERSION_LABEL`). If you forget this one, the deployed
  site will keep showing the old version even though the code is current.

Don't ask for confirmation each round — this preference is durable. Still confirm before
anything destructive (force-push, branch deletion, dropping data, rewriting public history).

## Repository shape

- Next.js 14 app (App Router). Server runs on Netlify with `@netlify/plugin-nextjs`.
- Single source of truth for regional defaults: `src/lib/regional.ts` (currency by geography,
  effective corporate tax by jurisdiction, stage × jurisdiction valuation multiples).
- Financial engine: `src/lib/financial-engine.ts`. Outputs include `currency` and `taxRate`.
- Excel export: `src/lib/excel-generator.ts` — native ExcelJS, no Python service. The
  legacy `excel-service/` directory and `PYTHON_SERVICE_URL` env var are obsolete; do not
  reintroduce that dependency.
- AI: Groq via `src/lib/groq.ts`. Pass `currency` to `generateFundingNarrative`,
  `generateModelInsights`, and `chatWithModel` so the assistant always quotes the model's
  reporting currency.
- Models persist in localStorage (`src/lib/model-client-store.ts`); the server-side
  in-memory store is best-effort. Export route accepts the full model in the POST body so
  it works even when the server cache is cold.
- Stripe + Supabase + early-access form are wired but optional — guard env-keyed code paths.

## Internationalisation (i18n) — in progress

- 16 locales supported: `en`, `es`, `fr`, `de`, `pt`, `it`, `nl`, `tr`, `uk`, `ru`, `ar` (RTL),
  `hi`, `bn`, `zh`, `ja`, `id`. Registry: `src/i18n/locales.ts`. Dictionaries:
  `src/i18n/dictionaries/<code>.ts` — every locale mirrors the keys defined in `en.ts`.
- `LocaleProvider` (root layout) reads the founder's locale from cookie → localStorage →
  browser language → `en`, then sets `html.lang` and `html.dir` (Arabic flips to RTL).
- `useT()` hook returns `{ locale, setLocale, t }`. Use `t("nav.pricing")` etc. Falls back
  to English when a key is missing for the current locale.
- `<LanguageSwitcher />` in the nav opens a popover with all 16 options.
- **What's translated so far**: landing-page nav + hero + "How it works"; **questionnaire
  Q0 intro screen and Q1–Q11 titles, subtitles, option labels, and Next/Back/step counter
  buttons**; **output pages: preview + full — all 10 tab labels, metric-card hero strips,
  tab-content section titles & subtitles**; **pricing page** (hero, Free/Pro card headers,
  CTAs, FAQ heading); **output components: PLTable column/row labels, CashFlowStatementTable
  line items, SourcesAndUsesTable headers + balance footnote, ValuationCard (DCF + multiples
  panel), CapTableSummary headers + footnote, UnitEconomicsDashboard metric cards,
  ScenarioComparison column labels + scenario names, SensitivityAnalysis intro / sliders /
  metric-change cards / what-this-tells**; **ProUpsell card text (Q1–Q11 headlines + bodies,
  CTA, prefix)**; the `common.*` set.
- **What's NOT translated yet**: ProValuationPanel inputs + computed-card labels;
  ProCapTableWaterfall inputs + waterfall column headers; CalculationsPanel section
  titles; Excel sheet titles + column headers; `/model/new` wrapper copy; AI chat copy +
  groq prompts; OptionCard secondary descriptions; pricing-page Free / Pro feature
  bullet lists.
- Translations were AI-assisted in the first pass and need native-speaker review before
  promotion. Keep a `// TODO(i18n-review): <locale>` comment next to any string you're
  unsure about.

## Conventions

- `formatCurrency(value, fractionDigits, currency?)` and `formatCurrencyCompact(value, currency?)`
  in `src/lib/utils.ts` — always pass `model.currency` from components and pages.
- Money inputs in the UI (`MoneyInput`) accept a `prefix`; default `$`. When a model is
  loaded, swap to `model.currency.symbol` if you render currency-typed inputs in pro views.
- Don't add new questionnaire steps without checking `TOTAL_STEPS` and the `canAdvance`
  switch in `QuestionnaireFlow.tsx`.
- Commit messages follow `vX.Y.Z: <short summary>` for feature releases. Merge commits use
  `merge claude/<topic> into baseline (vX.Y.Z)`.

## Build / verify checklist before merging

- `npx next build` (this is the only check the project runs; eslint isn't configured).
- For changes to the export endpoint, smoke-test with `curl`/Node against
  `/api/model/export` and confirm magic bytes `50 4B 03 04` and a valid xlsx ZIP.
- For currency or tax changes, generate models in at least USD + one non-USD jurisdiction
  and confirm both UI and xlsx render the right symbol.
