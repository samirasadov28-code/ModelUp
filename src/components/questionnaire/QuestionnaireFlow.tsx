"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, ArrowRight, Wand2, Lock } from "lucide-react";
import { saveModelLocally } from "@/lib/model-client-store";
import { ProgressBar } from "./ProgressBar";
import { QuestionWrapper } from "./QuestionWrapper";
import { OptionCard } from "./OptionCard";
import { ProUpsell } from "./ProUpsell";
import { Input } from "@/components/ui/input";
import { MoneyInput } from "@/components/ui/money-input";
import { Label } from "@/components/ui/label";
import { RevenueStreamsEditor } from "./RevenueStreamsEditor";
import { cn } from "@/lib/utils";
import type {
  QuestionnaireAnswers,
  BusinessModel,
  CustomerType,
  Geography,
  FundingStage,
  GrowthCurve,
  ChurnEstimate,
  TierConfig,
  RevenueStream,
  TaxJurisdiction,
  RevenueModel,
} from "@/lib/types";
import {
  TAX_JURISDICTION_LABELS,
  TAX_JURISDICTION_FLAGS,
  FREE_TAX_JURISDICTIONS,
  PRO_TAX_JURISDICTIONS,
  defaultJurisdictionForGeography,
  taxRateForJurisdiction,
} from "@/lib/regional";
import { hasEarlyAccess } from "@/lib/early-access";
import { useT } from "@/i18n/LocaleProvider";

const TOTAL_STEPS = 11;

// Sensible starting defaults so every input appears pre-filled even when the
// user skips the AI intro. The Q5 tier scaffold gets replaced as soon as a
// business model / customer type is chosen.
const DEFAULT_ANSWERS: Partial<QuestionnaireAnswers> = {
  tiers: [
    { name: "Starter", monthlyPrice: 49, allocationPercent: 60 },
    { name: "Pro", monthlyPrice: 199, allocationPercent: 40 },
  ],
  acquisitionChannels: ["seo", "word-of-mouth"],
  useOfProceeds: ["product-dev", "hiring"],
  useOfProceedsAllocation: { "product-dev": 50, hiring: 50 },
  revenueStreams: [],
  monthlyChurnRate: 0,
  churnEstimate: "2to5",
  growthCurve: "base",
  businessModel: "saas",
  customerType: "b2b",
  geography: "us",
  taxJurisdiction: "us",
  fundingStage: "seed",
  headcount: "2–5",
  monthlyBurn: 30000,
  cac: 500,
  year1UserTarget: 500,
  fundingAsk: 1500000,
  targetRunway: 18,
  revenueModel: "subscription",
  // unitMonthlyVolumeGrowth is intentionally left unset — the engine falls
  // back to the Q9 annual scenario rate, so picking "base" actually drives
  // production growth instead of being silently overridden by a 5% default.
};

const tileOff = "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50";
const tileOn = "border-blue-500 bg-blue-50 text-blue-700";

// Vetted descriptions across business shapes. Each one is dense enough that
// the AI can infer a full set of defaults — pricing, CAC, churn, headcount,
// jurisdiction, raise size — instead of returning sparse suggestions.
const DESCRIPTION_EXAMPLES: { label: string; text: string }[] = [
  {
    label: "B2B SaaS — enterprise",
    text:
      "We're building a B2B SaaS that helps mid-market law firms automate contract review with AI. We charge $400/seat/month and the typical firm buys 25 seats. Sales-led GTM targeting 50–300 lawyer firms in the US. Team of 5 in Delaware, raising a $2M seed for hiring AEs and product.",
  },
  {
    label: "Marketplace — consumer",
    text:
      "Two-sided marketplace connecting independent therapists with patients in the UK. We take a 15% cut on every booked session (avg £80 per session). 500 therapists onboarded, 4,000 sessions booked last month. Incorporated in London, team of 3, raising £750k pre-seed.",
  },
  {
    label: "Consumer mobile",
    text:
      "Freemium iOS app for habit tracking. Free tier with a $4.99/mo Pro upgrade and a $39/yr plan. 25k MAU, ~4% paid conversion, mostly US and Europe. Team of 4 in Berlin (German GmbH), raising €1.5M seed to scale paid acquisition and ship Android.",
  },
  {
    label: "Services + software",
    text:
      "Boutique fractional CFO firm for Series A SaaS startups. Retainer pricing $8k/month with average client retention of 18 months. 8 fractional CFOs on the team, headquartered in Singapore. Bootstrapped to ~$1M ARR, now raising a $3M seed to build software around our process.",
  },
];

export function QuestionnaireFlow() {
  const router = useRouter();
  const { t } = useT();
  // step 0 = intro/describe-your-startup screen, 1..10 = the questionnaire
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<QuestionnaireAnswers>>(DEFAULT_ANSWERS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasPro, setHasPro] = useState(false);

  // Intro state
  const [description, setDescription] = useState("");
  const [exampleIdx, setExampleIdx] = useState(0);
  const [suggesting, setSuggesting] = useState(false);
  const [suggestError, setSuggestError] = useState<string | null>(null);
  const [aiNote, setAiNote] = useState<string | null>(null);
  const [showProJurisdictions, setShowProJurisdictions] = useState(false);

  function handleUseExample() {
    const example = DESCRIPTION_EXAMPLES[exampleIdx];
    setDescription(example.text);
    setSuggestError(null);
    setExampleIdx((idx) => (idx + 1) % DESCRIPTION_EXAMPLES.length);
  }

  // Detect Pro/early-access on mount so we can ungate the full jurisdiction list.
  useEffect(() => {
    if (hasEarlyAccess()) setHasPro(true);
  }, []);

  const [tierCount, setTierCountRaw] = useState(
    DEFAULT_ANSWERS.tiers && DEFAULT_ANSWERS.tiers.length > 0 ? DEFAULT_ANSWERS.tiers.length : 2
  );

  /**
   * Set the number of visible tiers and rebalance allocation so the visible
   * tiers always sum to 100%. 1 tier → 100% on that tier; switching from 3 → 2
   * proportionally redistributes the dropped tier's share.
   */
  function setTierCount(n: number) {
    setTierCountRaw(n);
    const existing = answers.tiers ?? [];
    const visible: TierConfig[] = [];
    for (let i = 0; i < n; i++) {
      visible.push(
        existing[i] ?? {
          name: ["Free", "Basic", "Pro", "Enterprise"][i] ?? `Tier ${i + 1}`,
          monthlyPrice: 0,
          allocationPercent: 0,
        }
      );
    }
    if (n === 1) {
      visible[0] = { ...visible[0], allocationPercent: 100 };
    } else {
      const total = visible.reduce((s, t) => s + (t.allocationPercent || 0), 0);
      if (total <= 0) {
        const each = Math.floor(100 / n);
        const remainder = 100 - each * n;
        visible.forEach((t, i) => {
          t.allocationPercent = each + (i === 0 ? remainder : 0);
        });
      } else if (Math.abs(total - 100) > 0.5) {
        // Scale visible tiers to sum to 100 (preserves their relative weights).
        const scale = 100 / total;
        let runningTotal = 0;
        visible.forEach((t, i) => {
          if (i === visible.length - 1) {
            t.allocationPercent = Math.max(0, 100 - runningTotal);
          } else {
            t.allocationPercent = Math.round((t.allocationPercent || 0) * scale);
            runningTotal += t.allocationPercent;
          }
        });
      }
    }
    update("tiers", visible);
  }

  const update = <K extends keyof QuestionnaireAnswers>(
    key: K,
    value: QuestionnaireAnswers[K]
  ) => setAnswers((prev) => ({ ...prev, [key]: value }));

  function updateTier(idx: number, field: keyof TierConfig, value: string | number) {
    const tiers = [...(answers.tiers ?? [])];
    while (tiers.length <= idx) tiers.push({ name: "", monthlyPrice: 0, allocationPercent: 0 });
    tiers[idx] = { ...tiers[idx], [field]: value };
    // For a single tier the allocation is always 100% — never let a stray edit break that.
    if (tierCount === 1 && field !== "allocationPercent") {
      tiers[0] = { ...tiers[0], allocationPercent: 100 };
    }
    update("tiers", tiers);
  }

  const canAdvance = (): boolean => {
    switch (step) {
      case 1: return !!answers.businessModel;
      case 2: return !!answers.customerType;
      case 3: return !!answers.geography && !!answers.taxJurisdiction;
      case 4: return !!answers.fundingStage;
      case 5: {
        const model = answers.revenueModel ?? "subscription";
        const subsOk = (answers.tiers?.length ?? 0) > 0 && answers.tiers!.every((t) => t.monthlyPrice > 0);
        const prodOk = (answers.unitsYear1 ?? 0) > 0 && (answers.unitPrice ?? 0) > 0 && (answers.unitCost ?? -1) >= 0;
        if (model === "production") return prodOk;
        if (model === "hybrid") return subsOk && prodOk;
        return subsOk;
      }
      case 6: return !!answers.cac && answers.cac > 0;
      case 7: return !!answers.churnEstimate;
      case 8: return !!answers.headcount && !!answers.monthlyBurn && answers.monthlyBurn > 0;
      case 9: {
        const rm = answers.revenueModel ?? "subscription";
        const hasTarget =
          rm === "production"
            ? (answers.unitsYear1 ?? 0) > 0
            : rm === "hybrid"
              ? (answers.year1UserTarget ?? 0) > 0 && (answers.unitsYear1 ?? 0) > 0
              : (answers.year1UserTarget ?? 0) > 0;
        return hasTarget && !!answers.growthCurve;
      }
      case 10: {
        if (!answers.fundingAsk || answers.fundingAsk <= 0) return false;
        if (answers.targetRunway == null) return false;
        const proceeds = answers.useOfProceeds ?? [];
        if (proceeds.length > 0) {
          const total = proceeds.reduce(
            (s, k) => s + (answers.useOfProceedsAllocation?.[k] ?? 0),
            0
          );
          if (Math.abs(total - 100) > 0.5) return false;
        }
        return true;
      }
      case 11:
        // We accept "no explicit pick" too — the engine falls back to a
        // stage-driven default, so the step can be ack'd by Next.
        return answers.discountRate == null || answers.discountRate > 0;
      default: return true;
    }
  };

  // Churn (step 7) only matters when revenue depends on a user base, so it's
  // hidden for production-only models. The step counter shrinks to match.
  const churnVisible = (answers.revenueModel ?? "subscription") !== "production";
  const stepTotal = churnVisible ? TOTAL_STEPS : TOTAL_STEPS - 1;
  const stepNum = (abs: number) => (!churnVisible && abs > 7 ? abs - 1 : abs);

  function handleNext() {
    if (step >= TOTAL_STEPS) {
      handleSubmit();
      return;
    }
    let next = step + 1;
    if (next === 7 && !churnVisible) next += 1; // skip churn for production
    setStep(next);
  }

  function handleBack() {
    let prev = step - 1;
    if (prev === 7 && !churnVisible) prev -= 1; // skip churn for production
    setStep(Math.max(0, prev));
  }

  async function handleSuggest(e: FormEvent) {
    e.preventDefault();
    if (suggesting) return;
    if (description.trim().length < 10) {
      setSuggestError(t("q0.error_too_short"));
      return;
    }
    setSuggesting(true);
    setSuggestError(null);
    try {
      const res = await fetch("/api/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t("q0.error_suggest_failed"));

      const s = (data.suggestions ?? {}) as Partial<QuestionnaireAnswers> & { reasoning?: string };
      setAnswers((prev) => {
        const merged: Partial<QuestionnaireAnswers> = { ...prev };
        for (const [key, value] of Object.entries(s)) {
          if (key === "reasoning") continue;
          if (value === undefined || value === null) continue;
          (merged as Record<string, unknown>)[key] = value;
        }
        return merged;
      });
      if (Array.isArray(s.tiers) && s.tiers.length > 0) {
        setTierCount(Math.min(4, s.tiers.length));
      }
      setAiNote(s.reasoning ?? "Smart defaults applied — review and adjust each step.");
      setStep(1);
    } catch (err) {
      setSuggestError(err instanceof Error ? err.message : t("q0.error_suggest_failed"));
    } finally {
      setSuggesting(false);
    }
  }

  function handleSkipIntro() {
    setAiNote(null);
    setStep(1);
  }

  async function handleSubmit() {
    setLoading(true);
    setError(null);
    try {
      const churnMap: Record<string, number> = {
        none: 0, lt2: 1.5, "2to5": 3.5, "5to10": 7.5, gt10: 12, unknown: 5,
      };
      const monthlyChurnRate = churnMap[answers.churnEstimate ?? "unknown"] ?? 5;

      const trimmedTiers = (answers.tiers ?? []).slice(0, tierCount);
      // Single-tier safety: always 100% on the only visible tier.
      if (tierCount === 1 && trimmedTiers[0]) {
        trimmedTiers[0] = { ...trimmedTiers[0], allocationPercent: 100 };
      }

      const payload: QuestionnaireAnswers = {
        businessModel: answers.businessModel ?? "saas",
        customerType: answers.customerType ?? "b2b",
        geography: answers.geography ?? "us",
        taxJurisdiction:
          answers.taxJurisdiction ?? defaultJurisdictionForGeography(answers.geography ?? "us"),
        fundingStage: answers.fundingStage ?? "seed",
        revenueModel: answers.revenueModel ?? "subscription",
        tiers: trimmedTiers,
        revenueStreams: answers.revenueStreams ?? [],
        unitsYear1: answers.unitsYear1,
        unitPrice: answers.unitPrice,
        unitCost: answers.unitCost,
        unitMonthlyVolumeGrowth: answers.unitMonthlyVolumeGrowth,
        acquisitionChannels: answers.acquisitionChannels ?? [],
        cac: answers.cac ?? 0,
        acv: answers.acv,
        avgMonthlySpend: answers.avgMonthlySpend,
        churnEstimate: answers.churnEstimate ?? "unknown",
        monthlyChurnRate,
        headcount: answers.headcount ?? "2–5",
        monthlyBurn: answers.monthlyBurn ?? 10000,
        year1UserTarget: answers.year1UserTarget ?? 100,
        growthCurve: answers.growthCurve ?? "base",
        fundingAsk: answers.fundingAsk ?? 500000,
        useOfProceeds: answers.useOfProceeds ?? [],
        useOfProceedsAllocation: answers.useOfProceedsAllocation,
        targetRunway: answers.targetRunway ?? 18,
        discountRate: answers.discountRate,
        terminalGrowthRate: answers.terminalGrowthRate,
        companyName: answers.companyName,
        modelStartDate: new Date().toISOString().slice(0, 10),
      };

      const res = await fetch("/api/model/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to generate model");
      const { modelId, outputs } = await res.json();

      if (outputs) saveModelLocally(outputs);

      router.push(`/model/${modelId}/preview`);
    } catch {
      setError(t("common.error_generic"));
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-2 border-blue-500/20 animate-ping" />
          <div className="absolute inset-2 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
        </div>
        <div className="text-center">
          <p className="text-gray-900 font-semibold">{t("q0.building_model")}</p>
          <p className="text-gray-500 text-sm mt-1">{t("q0.running_projections")}</p>
        </div>
      </div>
    );
  }

  if (step === 0) {
    return (
      <div className="w-full max-w-2xl mx-auto">
        <div className="rounded-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-6 md:p-8 shadow-xl shadow-blue-500/10">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">
              {t("common.smart_start")}
            </p>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-2 tracking-tight">
            {t("q0.intro_title")}
          </h2>
          <p className="text-sm text-gray-600 mb-5 leading-relaxed">
            {t("q0.intro_subtitle")}
          </p>
          <form onSubmit={handleSuggest} className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {t("q0.your_description")}
              </span>
              <button
                type="button"
                onClick={handleUseExample}
                disabled={suggesting}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:text-blue-800 bg-white hover:bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg transition-colors disabled:opacity-50"
                title={t("common.try_example")}
              >
                <Wand2 className="w-3 h-3" />
                {t("q0.try_example_prefix")} {DESCRIPTION_EXAMPLES[exampleIdx].label}
              </button>
            </div>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                if (suggestError) setSuggestError(null);
              }}
              placeholder={t("q0.placeholder")}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 resize-none"
            />
            {suggestError && (
              <p className="text-xs text-red-600">{suggestError}</p>
            )}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="submit"
                disabled={suggesting}
                className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm shadow-blue-500/20"
              >
                {suggesting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {t("common.thinking")}
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    {t("q0.get_smart_defaults")}
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleSkipIntro}
                disabled={suggesting}
                className="inline-flex items-center justify-center gap-2 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                {t("q0.skip_intro")}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
          <p className="text-xs text-gray-500 mt-4">{t("q0.tip")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8">
      <ProgressBar current={stepNum(step)} total={stepTotal} />
      {aiNote && (
        <div className="rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3 flex items-start gap-2">
          <Sparkles className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
          <div className="flex-1 text-xs text-gray-700">
            <span className="font-semibold text-blue-700">{t("q0.ai_prefilled")}</span>{" "}
            {aiNote} {t("q0.review_each")}
          </div>
          <button
            type="button"
            onClick={() => setAiNote(null)}
            className="text-gray-400 hover:text-gray-700 text-xs"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      )}
      {error && (
        <p className="text-red-600 text-sm text-center bg-red-50 border border-red-100 rounded-lg p-3">
          {error}
        </p>
      )}

      {/* Q1 — Business model */}
      {step === 1 && (
        <QuestionWrapper
          stepNumber={1} totalSteps={stepTotal}
          title={t("q1.title")}
          subtitle={t("q1.subtitle")}
          onNext={handleNext} onBack={handleBack}
          nextDisabled={!canAdvance()}
        >
          {[
            { value: "saas", label: t("q1.opt_saas"), desc: t("q1.desc_saas"), icon: "⚡" },
            { value: "marketplace", label: t("q1.opt_marketplace"), desc: t("q1.desc_marketplace"), icon: "🔄" },
            { value: "product", label: t("q1.opt_product"), desc: t("q1.desc_product"), icon: "📦" },
            { value: "service", label: t("q1.opt_service"), desc: t("q1.desc_service"), icon: "🤝" },
            { value: "other", label: t("q1.opt_other"), desc: t("q1.desc_other"), icon: "🏗️" },
          ].map((opt) => (
            <OptionCard
              key={opt.value}
              label={opt.label}
              description={opt.desc}
              icon={opt.icon}
              selected={answers.businessModel === opt.value}
              onClick={() => update("businessModel", opt.value as BusinessModel)}
            />
          ))}
          <ProUpsell
            headline={t("ups.q1_head")}
            body={t("ups.q1_body")}
          />
        </QuestionWrapper>
      )}

      {/* Q2 — Customer type */}
      {step === 2 && (
        <QuestionWrapper
          stepNumber={2} totalSteps={stepTotal}
          title={t("q2.title")}
          onNext={handleNext} onBack={handleBack}
          nextDisabled={!canAdvance()}
        >
          {[
            { value: "b2b", label: t("q2.opt_b2b"), desc: t("q2.desc_b2b"), icon: "🏢" },
            { value: "b2c", label: t("q2.opt_b2c"), desc: t("q2.desc_b2c"), icon: "👤" },
            { value: "both", label: t("q2.opt_both"), desc: t("q2.desc_both"), icon: "🌐" },
          ].map((opt) => (
            <OptionCard
              key={opt.value}
              label={opt.label}
              description={opt.desc}
              icon={opt.icon}
              selected={answers.customerType === opt.value}
              onClick={() => update("customerType", opt.value as CustomerType)}
            />
          ))}
          <ProUpsell
            headline={t("ups.q2_head")}
            body={t("ups.q2_body")}
          />
        </QuestionWrapper>
      )}

      {/* Q3 — Geography + tax jurisdiction */}
      {step === 3 && (
        <QuestionWrapper
          stepNumber={3} totalSteps={stepTotal}
          title={t("q3.title")}
          subtitle={t("q3.subtitle")}
          onNext={handleNext} onBack={handleBack}
          nextDisabled={!canAdvance()}
        >
          <div>
            <Label className="text-gray-500 text-xs uppercase tracking-wider font-semibold">
              {t("q3.primary_market")}
            </Label>
            <div className="mt-2 space-y-2">
              {[
                { value: "us", label: t("q3.geo_us"), icon: "🇺🇸" },
                { value: "uk", label: t("q3.geo_uk"), icon: "🇬🇧" },
                { value: "eu", label: t("q3.geo_eu"), icon: "🇪🇺" },
                { value: "asia", label: t("q3.geo_asia"), icon: "🌏" },
                { value: "global", label: t("q3.geo_global"), icon: "🌍" },
              ].map((opt) => (
                <OptionCard
                  key={opt.value}
                  label={opt.label}
                  icon={opt.icon}
                  selected={answers.geography === opt.value}
                  onClick={() => {
                    const geo = opt.value as Geography;
                    update("geography", geo);
                    // Auto-fill tax jurisdiction the first time the user picks a market.
                    if (!answers.taxJurisdiction) {
                      update("taxJurisdiction", defaultJurisdictionForGeography(geo));
                    }
                  }}
                />
              ))}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-gray-100">
            <Label className="text-gray-500 text-xs uppercase tracking-wider font-semibold">
              {t("q3.tax_base")}
            </Label>
            <p className="text-xs text-gray-500 mt-1 mb-3">
              {t("q3.tax_base_help")}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {FREE_TAX_JURISDICTIONS.map((j) => {
                const selected = answers.taxJurisdiction === j;
                const rate = taxRateForJurisdiction(j);
                return (
                  <button
                    key={j}
                    type="button"
                    onClick={() => update("taxJurisdiction", j)}
                    className={cn(
                      "flex items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-left transition-all",
                      selected ? tileOn : tileOff
                    )}
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <span className="text-base shrink-0">{TAX_JURISDICTION_FLAGS[j]}</span>
                      <span className="text-sm font-medium truncate">
                        {TAX_JURISDICTION_LABELS[j]}
                      </span>
                    </span>
                    <span
                      className={cn(
                        "text-[10px] font-mono shrink-0 tabular-nums",
                        selected ? "text-blue-700" : "text-gray-400"
                      )}
                    >
                      {(rate * 100).toFixed(1)}%
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Extended jurisdictions — Pro-gated. Free users see a teaser; Pro users get a real dropdown. */}
            {hasPro ? (
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => setShowProJurisdictions((v) => !v)}
                  className="text-xs font-semibold text-blue-700 hover:text-blue-800"
                >
                  {showProJurisdictions ? "Hide" : "Show"} all {PRO_TAX_JURISDICTIONS.length}+ Pro jurisdictions →
                </button>
                {showProJurisdictions && (
                  <div className="mt-2">
                    <select
                      value={
                        PRO_TAX_JURISDICTIONS.includes(answers.taxJurisdiction as TaxJurisdiction)
                          ? answers.taxJurisdiction
                          : ""
                      }
                      onChange={(e) => {
                        const v = e.target.value as TaxJurisdiction;
                        if (v) update("taxJurisdiction", v);
                      }}
                      className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400"
                    >
                      <option value="">Select a jurisdiction…</option>
                      {PRO_TAX_JURISDICTIONS.map((j) => (
                        <option key={j} value={j}>
                          {TAX_JURISDICTION_FLAGS[j]} {TAX_JURISDICTION_LABELS[j]} —{" "}
                          {(taxRateForJurisdiction(j) * 100).toFixed(1)}% corp tax
                        </option>
                      ))}
                    </select>
                    {answers.taxJurisdiction &&
                      PRO_TAX_JURISDICTIONS.includes(answers.taxJurisdiction as TaxJurisdiction) && (
                        <p className="mt-2 text-xs text-blue-700">
                          Tax base set to{" "}
                          <span className="font-semibold">
                            {TAX_JURISDICTION_LABELS[answers.taxJurisdiction]}
                          </span>{" "}
                          ({(taxRateForJurisdiction(answers.taxJurisdiction) * 100).toFixed(1)}%
                          effective rate).
                        </p>
                      )}
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-4 rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50/60 to-white p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Lock className="w-3.5 h-3.5 text-blue-600" />
                  <p className="text-xs font-semibold text-gray-900">
                    Need a different jurisdiction?
                  </p>
                </div>
                <p className="text-xs text-gray-600 leading-snug">
                  Pro unlocks {PRO_TAX_JURISDICTIONS.length}+ tax bases including Germany, France,
                  Singapore, India, UAE, Switzerland, Estonia, Brazil, Mexico, Israel — each with the
                  effective corporate-tax rate and a region-priced valuation multiple.{" "}
                  <a href="/pricing" className="text-blue-700 font-semibold hover:underline">
                    See Pro →
                  </a>
                </p>
              </div>
            )}
          </div>

          <ProUpsell
            headline={t("ups.q3_head")}
            body={t("ups.q3_body")}
          />
        </QuestionWrapper>
      )}

      {/* Q4 — Funding stage */}
      {step === 4 && (
        <QuestionWrapper
          stepNumber={4} totalSteps={stepTotal}
          title={t("q4.title")}
          subtitle={t("q4.subtitle")}
          onNext={handleNext} onBack={handleBack}
          nextDisabled={!canAdvance()}
        >
          {[
            { value: "pre-seed", label: t("q4.opt_pre_seed"), desc: t("q4.desc_pre_seed"), icon: "🌱" },
            { value: "seed", label: t("q4.opt_seed"), desc: t("q4.desc_seed"), icon: "🚀" },
            { value: "series-a", label: t("q4.opt_series_a"), desc: t("q4.desc_series_a"), icon: "📈" },
            { value: "series-b", label: t("q4.opt_series_b"), desc: t("q4.desc_series_b"), icon: "🏆" },
          ].map((opt) => (
            <OptionCard
              key={opt.value}
              label={opt.label}
              description={opt.desc}
              icon={opt.icon}
              selected={answers.fundingStage === opt.value}
              onClick={() => update("fundingStage", opt.value as FundingStage)}
            />
          ))}
          <ProUpsell
            headline={t("ups.q4_head")}
            body={t("ups.q4_body")}
          />
        </QuestionWrapper>
      )}

      {/* Q5 — Revenue model */}
      {step === 5 && (
        <QuestionWrapper
          stepNumber={5} totalSteps={stepTotal}
          title={t("q5.title")}
          subtitle={t("q5.subtitle")}
          onNext={handleNext} onBack={handleBack}
          nextDisabled={!canAdvance()}
        >
          <div>
            <Label className="text-gray-500 text-xs uppercase tracking-wider font-semibold">
              {t("q5.revenue_model")}
            </Label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {[
                { value: "subscription", label: t("q5.rm_subscription"), desc: t("q5.desc_subscription"), icon: "🔁" },
                { value: "production", label: t("q5.rm_production"), desc: t("q5.desc_production"), icon: "🏭" },
                { value: "hybrid", label: t("q5.rm_hybrid"), desc: t("q5.desc_hybrid"), icon: "🔀" },
              ].map((opt) => {
                const selected = (answers.revenueModel ?? "subscription") === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => update("revenueModel", opt.value as RevenueModel)}
                    className={cn(
                      "rounded-xl border px-3 py-3 text-left transition-all",
                      selected ? tileOn : tileOff
                    )}
                  >
                    <p className="text-sm font-semibold flex items-center gap-1.5">
                      <span>{opt.icon}</span> {opt.label}
                    </p>
                    <p className="text-[11px] text-gray-500 mt-0.5">{opt.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {((answers.revenueModel ?? "subscription") === "subscription"
            || answers.revenueModel === "hybrid") && (
            <div className="pt-4 mt-4 border-t border-gray-100">
              <Label className="text-gray-500 text-xs uppercase tracking-wider font-semibold">
                {t("q5.subscription_tiers")}
              </Label>
              <div className="mt-2 mb-4">
                <Label className="text-xs text-gray-500 font-medium">{t("q5.tier_count")}</Label>
                <div className="flex gap-2 mt-2">
                  {[1, 2, 3, 4].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setTierCount(n)}
                      className={cn(
                        "flex-1 py-2 rounded-lg text-sm font-medium border transition-all",
                        tierCount === n ? tileOn : tileOff
                      )}
                    >
                      {n} tier{n > 1 ? "s" : ""}
                    </button>
                  ))}
                </div>
              </div>

              {Array.from({ length: tierCount }, (_, i) => (
                <div key={i} className="rounded-xl border border-gray-200 bg-gray-50/60 p-4 space-y-3 mb-2">
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Tier {i + 1}</p>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-1">
                      <Label className="text-xs text-gray-600 mb-1 block font-medium">{t("q5.tier_name")}</Label>
                      <Input
                        placeholder={["Free", "Basic", "Pro", "Enterprise"][i] ?? `Tier ${i + 1}`}
                        value={answers.tiers?.[i]?.name ?? ""}
                        onChange={(e) => updateTier(i, "name", e.target.value || (["Free", "Basic", "Pro", "Enterprise"][i] ?? `Tier ${i + 1}`))}
                        className="text-sm h-9"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-600 mb-1 block font-medium">{t("q5.tier_price")}</Label>
                      <MoneyInput
                        placeholder="49"
                        value={answers.tiers?.[i]?.monthlyPrice || undefined}
                        onValueChange={(v) => updateTier(i, "monthlyPrice", v ?? 0)}
                        className="text-sm h-9"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-600 mb-1 block font-medium">{t("q5.tier_alloc")}</Label>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        placeholder={String(Math.floor(100 / tierCount))}
                        value={answers.tiers?.[i]?.allocationPercent ?? ""}
                        onChange={(e) => updateTier(i, "allocationPercent", Number(e.target.value))}
                        disabled={tierCount === 1}
                        className={cn("text-sm h-9", tierCount === 1 && "bg-gray-50 text-gray-500")}
                      />
                      {tierCount === 1 && (
                        <p className="text-[10px] text-gray-400 mt-1">{t("q5.tier_locked")}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <p className="text-xs text-gray-500 mt-2">
                {t("q5.allocation_total")} {answers.tiers?.reduce((s, tier) => s + (tier.allocationPercent || 0), 0) ?? 0}%
                {answers.tiers?.reduce((s, tier) => s + (tier.allocationPercent || 0), 0) !== 100 && (
                  <span className="text-amber-600 ml-1 font-medium">{t("q5.allocation_warning")}</span>
                )}
              </p>
            </div>
          )}

          {(answers.revenueModel === "production" || answers.revenueModel === "hybrid") && (
            <div className="pt-4 mt-4 border-t border-gray-100">
              <Label className="text-gray-500 text-xs uppercase tracking-wider font-semibold">
                {t("q5.production_section")}
              </Label>
              <p className="text-xs text-gray-500 mt-1 mb-3">
                Revenue = units sold × unit price. Direct cost flows through cost-per-unit, so margin
                = (price − cost) ÷ price.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-gray-600 mb-1 block font-medium">
                    {t("q5.units_year1")} <span className="text-red-500">*</span>
                  </Label>
                  <MoneyInput
                    prefix=""
                    placeholder="10,000"
                    value={answers.unitsYear1}
                    onValueChange={(v) => update("unitsYear1", v ?? 0)}
                    className="h-10"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-600 mb-1 block font-medium">
                    {t("q5.volume_growth")}
                  </Label>
                  <Input
                    type="number"
                    step="0.5"
                    placeholder="auto"
                    value={answers.unitMonthlyVolumeGrowth != null ? (answers.unitMonthlyVolumeGrowth * 100).toFixed(1) : ""}
                    onChange={(e) => {
                      const raw = e.target.value;
                      if (raw === "") {
                        update("unitMonthlyVolumeGrowth", undefined as unknown as number);
                      } else {
                        update("unitMonthlyVolumeGrowth", Number(raw) / 100);
                      }
                    }}
                    className="h-10"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">{t("q5.volume_growth_hint")}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-600 mb-1 block font-medium">
                    {t("q5.unit_price")} <span className="text-red-500">*</span>
                  </Label>
                  <MoneyInput
                    placeholder="49"
                    value={answers.unitPrice}
                    onValueChange={(v) => update("unitPrice", v ?? 0)}
                    className="h-10"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-600 mb-1 block font-medium">
                    {t("q5.unit_cost")} <span className="text-red-500">*</span>
                  </Label>
                  <MoneyInput
                    placeholder="22"
                    value={answers.unitCost}
                    onValueChange={(v) => update("unitCost", v ?? 0)}
                    className="h-10"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">{t("q5.unit_cost_help")}</p>
                </div>
              </div>
              {(answers.unitPrice ?? 0) > 0 && (answers.unitCost ?? 0) >= 0 && (
                <p className="text-xs text-gray-600 mt-3">
                  {t("q5.unit_margin")}{" "}
                  <span className="font-semibold text-blue-700">
                    {(((answers.unitPrice! - (answers.unitCost ?? 0)) / answers.unitPrice!) * 100).toFixed(1)}%
                  </span>{" "}
                  · ${(answers.unitPrice! - (answers.unitCost ?? 0)).toFixed(2)} / unit
                </p>
              )}
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-gray-200">
            <RevenueStreamsEditor
              value={answers.revenueStreams ?? []}
              onChange={(next: RevenueStream[]) => update("revenueStreams", next)}
            />
          </div>
          <ProUpsell
            headline={t("ups.q5_head")}
            body={t("ups.q5_body")}
          />
        </QuestionWrapper>
      )}

      {/* Q6 — Acquisition */}
      {step === 6 && (
        <QuestionWrapper
          stepNumber={6} totalSteps={stepTotal}
          title={t("q6.title")}
          subtitle={t("q6.subtitle")}
          onNext={handleNext} onBack={handleBack}
          nextDisabled={!canAdvance()}
        >
          <div className="grid grid-cols-2 gap-2 mb-4">
            {[
              { value: "paid-ads", label: t("q6.ch_paid_ads"), icon: "📢" },
              { value: "seo", label: t("q6.ch_seo"), icon: "🔍" },
              { value: "sales", label: t("q6.ch_sales"), icon: "📞" },
              { value: "partnerships", label: t("q6.ch_partnerships"), icon: "🤝" },
              { value: "word-of-mouth", label: t("q6.ch_word_of_mouth"), icon: "💬" },
              { value: "product-led", label: t("q6.ch_product_led"), icon: "⚡" },
            ].map((ch) => {
              const selected = answers.acquisitionChannels?.includes(ch.value);
              return (
                <button
                  key={ch.value}
                  type="button"
                  onClick={() => {
                    const curr = answers.acquisitionChannels ?? [];
                    update(
                      "acquisitionChannels",
                      selected ? curr.filter((c) => c !== ch.value) : [...curr, ch.value]
                    );
                  }}
                  className={cn(
                    "flex items-center gap-2 rounded-xl border px-4 py-3 text-sm transition-all",
                    selected ? tileOn : tileOff
                  )}
                >
                  <span>{ch.icon}</span>
                  {ch.label}
                </button>
              );
            })}
          </div>

          <div className="space-y-3">
            <div>
              <Label className="text-gray-700 mb-2 block font-medium">
                {t("q6.cac_label")} <span className="text-red-500">*</span>
              </Label>
              <MoneyInput
                placeholder="250"
                value={answers.cac}
                onValueChange={(v) => update("cac", v ?? 0)}
              />
              <p className="text-xs text-gray-500 mt-1">{t("q6.cac_help")}</p>
            </div>

            {(answers.customerType === "b2b" || answers.customerType === "both") && (
              <div>
                <Label className="text-gray-700 mb-2 block font-medium">{t("q6.acv_label")}</Label>
                <MoneyInput
                  placeholder="2,400"
                  value={answers.acv}
                  onValueChange={(v) => update("acv", v)}
                />
              </div>
            )}

            {(answers.customerType === "b2c" || answers.customerType === "both") && (
              <div>
                <Label className="text-gray-700 mb-2 block font-medium">{t("q6.avg_spend_label")}</Label>
                <MoneyInput
                  placeholder="29"
                  value={answers.avgMonthlySpend}
                  onValueChange={(v) => update("avgMonthlySpend", v)}
                />
              </div>
            )}
          </div>
          <ProUpsell
            headline={t("ups.q6_head")}
            body={t("ups.q6_body")}
          />
        </QuestionWrapper>
      )}

      {/* Q7 — Churn */}
      {step === 7 && (
        <QuestionWrapper
          stepNumber={7} totalSteps={stepTotal}
          title={t("q7.title")}
          subtitle={t("q7.subtitle")}
          onNext={handleNext} onBack={handleBack}
          nextDisabled={!canAdvance()}
        >
          {[
            { value: "none", label: t("q7.opt_none"), desc: t("q7.desc_none"), icon: "💎" },
            { value: "lt2", label: t("q7.opt_lt2"), desc: t("q7.desc_lt2"), icon: "🟢" },
            { value: "2to5", label: t("q7.opt_2to5"), desc: t("q7.desc_2to5"), icon: "🟡" },
            { value: "5to10", label: t("q7.opt_5to10"), desc: t("q7.desc_5to10"), icon: "🟠" },
            { value: "gt10", label: t("q7.opt_gt10"), desc: t("q7.desc_gt10"), icon: "🔴" },
            { value: "unknown", label: t("q7.opt_unknown"), desc: t("q7.desc_unknown"), icon: "❓" },
          ].map((opt) => (
            <OptionCard
              key={opt.value}
              label={opt.label}
              description={opt.desc}
              icon={opt.icon}
              selected={answers.churnEstimate === opt.value}
              onClick={() => update("churnEstimate", opt.value as ChurnEstimate)}
            />
          ))}
          <ProUpsell
            headline={t("ups.q7_head")}
            body={t("ups.q7_body")}
          />
        </QuestionWrapper>
      )}

      {/* Q8 — Team & costs */}
      {step === 8 && (
        <QuestionWrapper
          stepNumber={stepNum(8)} totalSteps={stepTotal}
          title={t("q8.title")}
          onNext={handleNext} onBack={handleBack}
          nextDisabled={!canAdvance()}
        >
          <div>
            <Label className="text-gray-700 mb-3 block font-medium">{t("q8.headcount")}</Label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: "1", label: t("q8.hc_1") },
                { value: "2–5", label: t("q8.hc_2_5") },
                { value: "6–15", label: t("q8.hc_6_15") },
                { value: "15+", label: t("q8.hc_15_plus") },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => update("headcount", opt.value)}
                  className={cn(
                    "py-3 rounded-xl border text-sm font-medium transition-all",
                    answers.headcount === opt.value ? tileOn : tileOff
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <Label className="text-gray-700 mb-2 block font-medium">
              {t("q8.monthly_burn")} <span className="text-red-500">*</span>
            </Label>
            <MoneyInput
              placeholder="15,000"
              value={answers.monthlyBurn}
              onValueChange={(v) => update("monthlyBurn", v ?? 0)}
            />
            <p className="text-xs text-gray-500 mt-1">{t("q8.burn_help")}</p>
          </div>
          <ProUpsell
            headline={t("ups.q8_head")}
            body={t("ups.q8_body")}
          />
        </QuestionWrapper>
      )}

      {/* Q9 — Growth ambition */}
      {step === 9 && (
        <QuestionWrapper
          stepNumber={stepNum(9)} totalSteps={stepTotal}
          title={t("q9.title")}
          onNext={handleNext} onBack={handleBack}
          nextDisabled={!canAdvance()}
        >
          {(() => {
            const rm = answers.revenueModel ?? "subscription";
            return (
              <>
                {rm !== "production" && (
                  <div className="mb-4">
                    <Label className="text-gray-700 mb-2 block font-medium">
                      {t("q9.year1_target")} <span className="text-red-500">*</span>
                    </Label>
                    <MoneyInput
                      prefix=""
                      placeholder="500"
                      value={answers.year1UserTarget}
                      onValueChange={(v) => update("year1UserTarget", v ?? 0)}
                    />
                    <p className="text-xs text-gray-500 mt-1">{t("q9.year1_target_help")}</p>
                  </div>
                )}
                {(rm === "production" || rm === "hybrid") && (
                  <div className="mb-4">
                    <Label className="text-gray-700 mb-2 block font-medium">
                      {t("q9.units_target")} <span className="text-red-500">*</span>
                    </Label>
                    <MoneyInput
                      prefix=""
                      placeholder="10,000"
                      value={answers.unitsYear1}
                      onValueChange={(v) => update("unitsYear1", v ?? 0)}
                    />
                    <p className="text-xs text-gray-500 mt-1">{t("q9.units_target_help")}</p>
                  </div>
                )}
              </>
            );
          })()}

          <div>
            <Label className="text-gray-700 mb-3 block font-medium">{t("q9.growth_scenario")}</Label>
            {(() => {
              // For production businesses the engine treats Q9 as an annual rate
              // (manufacturing volumes don't compound 9% MoM). Show the matching
              // copy so the picker label matches the math.
              const isProd = answers.revenueModel === "production";
              return [
                { value: "conservative", label: t("q9.opt_conservative"), desc: isProd ? t("q9.desc_conservative_prod") : t("q9.desc_conservative"), icon: "🛡️" },
                { value: "base", label: t("q9.opt_base"), desc: isProd ? t("q9.desc_base_prod") : t("q9.desc_base"), icon: "📊" },
                { value: "aggressive", label: t("q9.opt_aggressive"), desc: isProd ? t("q9.desc_aggressive_prod") : t("q9.desc_aggressive"), icon: "🚀" },
              ];
            })().map((opt) => (
              <OptionCard
                key={opt.value}
                label={opt.label}
                description={opt.desc}
                icon={opt.icon}
                selected={answers.growthCurve === opt.value}
                onClick={() => update("growthCurve", opt.value as GrowthCurve)}
              />
            ))}
          </div>
          <ProUpsell
            headline={t("ups.q9_head")}
            body={t("ups.q9_body")}
          />
        </QuestionWrapper>
      )}

      {/* Q10 — Fundraising ask */}
      {step === 10 && (
        <QuestionWrapper
          stepNumber={stepNum(10)} totalSteps={stepTotal}
          title={t("q10.title")}
          subtitle={t("q10.subtitle")}
          onNext={handleNext} onBack={handleBack}
          nextDisabled={!canAdvance()}
        >
          <div>
            <Label className="text-gray-700 mb-2 block font-medium">
              {t("q10.raise_amount")} <span className="text-red-500">*</span>
            </Label>
            <MoneyInput
              placeholder="1,000,000"
              value={answers.fundingAsk}
              onValueChange={(v) => update("fundingAsk", v ?? 0)}
            />
          </div>

          {(() => {
            const PROCEEDS_OPTIONS = [
              { value: "product-dev", label: t("q10.uop_product_dev") },
              { value: "hiring", label: t("q10.uop_hiring") },
              { value: "marketing", label: t("q10.uop_marketing") },
              { value: "operations", label: t("q10.uop_operations") },
              { value: "working-capital", label: t("q10.uop_working_capital") },
            ];
            const selected = answers.useOfProceeds ?? [];
            const alloc = answers.useOfProceedsAllocation ?? {};
            const allocTotal = selected.reduce((s, k) => s + (alloc[k] ?? 0), 0);

            function toggle(value: string) {
              const isOn = selected.includes(value);
              const nextSelected = isOn ? selected.filter((v) => v !== value) : [...selected, value];
              // Even split across the new set so the user gets a sensible
              // starting point. They can then tweak each row.
              const each = nextSelected.length > 0 ? Math.floor(100 / nextSelected.length) : 0;
              const remainder = nextSelected.length > 0 ? 100 - each * nextSelected.length : 0;
              const nextAlloc: Record<string, number> = {};
              nextSelected.forEach((k, i) => {
                nextAlloc[k] = each + (i === 0 ? remainder : 0);
              });
              update("useOfProceeds", nextSelected);
              update("useOfProceedsAllocation", nextAlloc);
            }

            function setOne(key: string, value: number) {
              const v = Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 0;
              update("useOfProceedsAllocation", { ...alloc, [key]: v });
            }

            return (
              <div className="mt-3">
                <Label className="text-gray-700 mb-3 block font-medium">
                  {t("q10.use_of_proceeds")}
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {PROCEEDS_OPTIONS.map((opt) => {
                    const on = selected.includes(opt.value);
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => toggle(opt.value)}
                        className={cn(
                          "py-2.5 rounded-xl border text-sm transition-all",
                          on ? tileOn : tileOff
                        )}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>

                {selected.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
                      {t("q10.uop_allocation")}
                    </p>
                    {selected.map((key) => {
                      const opt = PROCEEDS_OPTIONS.find((o) => o.value === key);
                      const pct = alloc[key] ?? 0;
                      return (
                        <div key={key} className="flex items-center gap-3">
                          <span className="text-sm text-gray-700 flex-1">{opt?.label ?? key}</span>
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            value={Number.isFinite(pct) ? pct : 0}
                            onChange={(e) => setOne(key, Number(e.target.value))}
                            className="w-20 text-sm h-9 text-right tabular-nums"
                          />
                          <span className="text-sm text-gray-500 w-4">%</span>
                          <span className="text-xs text-gray-400 tabular-nums w-20 text-right">
                            {answers.fundingAsk
                              ? `≈ ${Math.round((answers.fundingAsk * pct) / 100).toLocaleString("en-US")}`
                              : "—"}
                          </span>
                        </div>
                      );
                    })}
                    <p className="text-xs text-gray-500 mt-2">
                      Allocation total: {allocTotal}%
                      {allocTotal !== 100 && (
                        <span className="text-amber-600 ml-1 font-medium">(should total 100%)</span>
                      )}
                    </p>
                  </div>
                )}
              </div>
            );
          })()}

          <div className="mt-3">
            <Label className="text-gray-700 mb-3 block font-medium">{t("q10.target_runway")}</Label>
            <div className="grid grid-cols-4 gap-2">
              {[12, 18, 24, 36].map((months) => (
                <button
                  key={months}
                  type="button"
                  onClick={() => update("targetRunway", months as 12 | 18 | 24 | 36)}
                  className={cn(
                    "py-2.5 rounded-xl border text-sm font-medium transition-all",
                    answers.targetRunway === months ? tileOn : tileOff
                  )}
                >
                  {t("q10.runway_months", { months })}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-3">
            <Label className="text-gray-700 mb-2 block font-medium">{t("q10.company_name")}</Label>
            <Input
              placeholder="Your startup"
              value={answers.companyName ?? ""}
              onChange={(e) => update("companyName", e.target.value)}
            />
          </div>
          <ProUpsell
            headline={t("ups.q10_head")}
            body={t("ups.q10_body")}
          />
        </QuestionWrapper>
      )}

      {/* Q11 — Discount rate */}
      {step === 11 && (() => {
        const DEFAULTS_BY_STAGE: Record<string, number> = {
          "pre-seed": 35,
          seed: 28,
          "series-a": 22,
          "series-b": 17,
        };
        const stage = answers.fundingStage ?? "seed";
        const stageDefault = DEFAULTS_BY_STAGE[stage] ?? 25;
        const currentPct =
          answers.discountRate != null
            ? Math.round(answers.discountRate * 1000) / 10
            : stageDefault;

        const PRESETS: { label: string; pct: number; desc: string }[] = [
          { label: t("q11.preset_mature"), pct: 10, desc: t("q11.desc_mature") },
          { label: t("q11.preset_established"), pct: 15, desc: t("q11.desc_established") },
          { label: t("q11.preset_series_a"), pct: 22, desc: t("q11.desc_series_a") },
          { label: t("q11.preset_seed"), pct: 28, desc: t("q11.desc_seed") },
          { label: t("q11.preset_pre_seed"), pct: 35, desc: t("q11.desc_pre_seed") },
          { label: t("q11.preset_venture"), pct: 45, desc: t("q11.desc_venture") },
        ];

        const setRate = (pct: number) => update("discountRate", Math.max(0, pct) / 100);

        return (
          <QuestionWrapper
            stepNumber={stepNum(11)} totalSteps={stepTotal}
            title={t("q11.title")}
            subtitle={t("q11.subtitle")}
            onNext={handleNext} onBack={handleBack}
            nextDisabled={!canAdvance()}
            isLast
          >
            <div>
              <Label className="text-gray-500 text-xs uppercase tracking-wider font-semibold">
                {t("q11.pick_preset")}
              </Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {PRESETS.map((p) => {
                  const selected = Math.abs(currentPct - p.pct) < 0.05;
                  return (
                    <button
                      key={p.pct}
                      type="button"
                      onClick={() => setRate(p.pct)}
                      className={cn(
                        "text-left rounded-xl border px-3 py-2.5 transition-all",
                        selected ? tileOn : tileOff
                      )}
                    >
                      <p className="text-sm font-semibold flex items-baseline justify-between gap-2">
                        <span>{p.label}</span>
                        <span className="font-mono tabular-nums text-xs">{p.pct}%</span>
                      </p>
                      <p className="text-[11px] text-gray-500 mt-0.5">{p.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-4">
              <Label className="text-gray-700 mb-2 block font-medium">
                {t("q11.custom_rate")} <span className="text-red-500">*</span>
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  step="0.5"
                  min={1}
                  max={100}
                  value={currentPct}
                  onChange={(e) => setRate(Number(e.target.value))}
                  className="w-32 text-sm h-10 tabular-nums"
                />
                <span className="text-sm text-gray-500">%</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                The {stage.replace("-", " ")} default is {stageDefault}% — bump up if your market is
                riskier, down if revenue is contracted and predictable.
              </p>
            </div>

            <div className="mt-4">
              <Label className="text-gray-700 mb-2 block font-medium">
                {t("q11.terminal_growth")}
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  step="0.5"
                  min={0}
                  max={15}
                  value={
                    answers.terminalGrowthRate != null
                      ? Math.round(answers.terminalGrowthRate * 1000) / 10
                      : 3
                  }
                  onChange={(e) =>
                    update("terminalGrowthRate", Math.max(0, Number(e.target.value)) / 100)
                  }
                  className="w-32 text-sm h-10 tabular-nums"
                />
                <span className="text-sm text-gray-500">%</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Used for the terminal-value (Gordon growth) leg of the DCF. 2–3% is a typical
                long-run assumption.
              </p>
            </div>

            <ProUpsell
              headline={t("ups.q11_head")}
              body={t("ups.q11_body")}
            />
          </QuestionWrapper>
        );
      })()}
    </div>
  );
}
