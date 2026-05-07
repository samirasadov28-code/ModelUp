"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, ArrowRight } from "lucide-react";
import { saveModelLocally } from "@/lib/model-client-store";
import { ProgressBar } from "./ProgressBar";
import { QuestionWrapper } from "./QuestionWrapper";
import { OptionCard } from "./OptionCard";
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
} from "@/lib/types";

const TOTAL_STEPS = 10;

const DEFAULT_ANSWERS: Partial<QuestionnaireAnswers> = {
  tiers: [],
  acquisitionChannels: [],
  useOfProceeds: [],
  revenueStreams: [],
  monthlyChurnRate: 0,
  growthCurve: "base",
};

const tileOff = "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50";
const tileOn = "border-blue-500 bg-blue-50 text-blue-700";

export function QuestionnaireFlow() {
  const router = useRouter();
  // step 0 = intro/describe-your-startup screen, 1..10 = the questionnaire
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<QuestionnaireAnswers>>(DEFAULT_ANSWERS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Intro state
  const [description, setDescription] = useState("");
  const [suggesting, setSuggesting] = useState(false);
  const [suggestError, setSuggestError] = useState<string | null>(null);
  const [aiNote, setAiNote] = useState<string | null>(null);

  const [tierCount, setTierCount] = useState(2);

  const update = <K extends keyof QuestionnaireAnswers>(
    key: K,
    value: QuestionnaireAnswers[K]
  ) => setAnswers((prev) => ({ ...prev, [key]: value }));

  function updateTier(idx: number, field: keyof TierConfig, value: string | number) {
    const tiers = [...(answers.tiers ?? [])];
    while (tiers.length <= idx) tiers.push({ name: "", monthlyPrice: 0, allocationPercent: 0 });
    tiers[idx] = { ...tiers[idx], [field]: value };
    update("tiers", tiers);
  }

  const canAdvance = (): boolean => {
    switch (step) {
      case 1: return !!answers.businessModel;
      case 2: return !!answers.customerType;
      case 3: return !!answers.geography;
      case 4: return !!answers.fundingStage;
      case 5: return (answers.tiers?.length ?? 0) > 0 && answers.tiers!.every((t) => t.monthlyPrice > 0);
      case 6: return !!answers.cac && answers.cac > 0;
      case 7: return !!answers.churnEstimate;
      case 8: return !!answers.headcount && !!answers.monthlyBurn && answers.monthlyBurn > 0;
      case 9: return !!answers.year1UserTarget && answers.year1UserTarget > 0 && !!answers.growthCurve;
      case 10: return !!answers.fundingAsk && answers.fundingAsk > 0 && answers.targetRunway != null;
      default: return true;
    }
  };

  function handleNext() {
    if (step < TOTAL_STEPS) {
      setStep((s) => s + 1);
    } else {
      handleSubmit();
    }
  }

  function handleBack() {
    setStep((s) => Math.max(0, s - 1));
  }

  async function handleSuggest(e: FormEvent) {
    e.preventDefault();
    if (suggesting) return;
    if (description.trim().length < 10) {
      setSuggestError("Tell us a bit more — at least one sentence.");
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
      if (!res.ok) throw new Error(data.error || "AI suggestions failed");

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
      setSuggestError(err instanceof Error ? err.message : "AI suggestions failed");
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
        lt2: 1.5, "2to5": 3.5, "5to10": 7.5, gt10: 12, unknown: 5,
      };
      const monthlyChurnRate = churnMap[answers.churnEstimate ?? "unknown"] ?? 5;

      const payload: QuestionnaireAnswers = {
        businessModel: answers.businessModel ?? "saas",
        customerType: answers.customerType ?? "b2b",
        geography: answers.geography ?? "us",
        fundingStage: answers.fundingStage ?? "seed",
        tiers: answers.tiers ?? [],
        revenueStreams: answers.revenueStreams ?? [],
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
        targetRunway: answers.targetRunway ?? 18,
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
      setError("Something went wrong. Please try again.");
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
          <p className="text-gray-900 font-semibold">Building your financial model…</p>
          <p className="text-gray-500 text-sm mt-1">Running projections across 3 scenarios</p>
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
            <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">Smart start</p>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-2 tracking-tight">
            Describe your startup in a few words
          </h2>
          <p className="text-sm text-gray-600 mb-5 leading-relaxed">
            One or two sentences is plenty. Our AI will pre-fill the next 10 questions with sensible
            defaults — your business model, customer type, pricing, burn, CAC, raise size and more —
            so you only review &amp; tweak instead of typing from scratch.
          </p>
          <form onSubmit={handleSuggest} className="space-y-3">
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                if (suggestError) setSuggestError(null);
              }}
              placeholder="e.g. We're building a B2B SaaS platform that helps law firms automate contract review with AI. Charging $200/seat/month, targeting US mid-market firms. Raising a seed round."
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
                    Thinking…
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Get smart defaults
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleSkipIntro}
                disabled={suggesting}
                className="inline-flex items-center justify-center gap-2 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                Skip — I&apos;ll fill it in myself
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
          <p className="text-xs text-gray-500 mt-4">
            Tip: the more you say (pricing, market, stage, headcount), the better the defaults. We
            never share your description.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8">
      <ProgressBar current={step} total={TOTAL_STEPS} />
      {aiNote && (
        <div className="rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3 flex items-start gap-2">
          <Sparkles className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
          <div className="flex-1 text-xs text-gray-700">
            <span className="font-semibold text-blue-700">Pre-filled from your description.</span>{" "}
            {aiNote} Review every step — you can edit anything.
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
          stepNumber={1} totalSteps={TOTAL_STEPS}
          title="What type of business are you building?"
          subtitle="This determines which financial model we use as the foundation."
          onNext={handleNext} onBack={handleBack}
          nextDisabled={!canAdvance()}
        >
          {[
            { value: "saas", label: "SaaS / Subscription", desc: "Software charged monthly or annually", icon: "⚡" },
            { value: "marketplace", label: "Marketplace", desc: "Connecting buyers and sellers, taking a cut", icon: "🔄" },
            { value: "product", label: "Product", desc: "Physical or digital product for purchase", icon: "📦" },
            { value: "service", label: "Service / Agency", desc: "Retainer or project-based professional services", icon: "🤝" },
            { value: "other", label: "Other", desc: "Infrastructure, cleantech, hardware, etc.", icon: "🏗️" },
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
        </QuestionWrapper>
      )}

      {/* Q2 — Customer type */}
      {step === 2 && (
        <QuestionWrapper
          stepNumber={2} totalSteps={TOTAL_STEPS}
          title="Who are your customers?"
          onNext={handleNext} onBack={handleBack}
          nextDisabled={!canAdvance()}
        >
          {[
            { value: "b2b", label: "B2B — businesses", desc: "Sell to companies, teams, or enterprises", icon: "🏢" },
            { value: "b2c", label: "B2C — consumers", desc: "Sell directly to individual users", icon: "👤" },
            { value: "both", label: "Both B2B and B2C", desc: "Mixed customer base", icon: "🌐" },
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
        </QuestionWrapper>
      )}

      {/* Q3 — Geography */}
      {step === 3 && (
        <QuestionWrapper
          stepNumber={3} totalSteps={TOTAL_STEPS}
          title="Where is your primary market?"
          onNext={handleNext} onBack={handleBack}
          nextDisabled={!canAdvance()}
        >
          {[
            { value: "us", label: "United States", icon: "🇺🇸" },
            { value: "uk", label: "United Kingdom", icon: "🇬🇧" },
            { value: "eu", label: "Europe (EU)", icon: "🇪🇺" },
            { value: "asia", label: "Asia Pacific", icon: "🌏" },
            { value: "global", label: "Global / Multi-market", icon: "🌍" },
          ].map((opt) => (
            <OptionCard
              key={opt.value}
              label={opt.label}
              icon={opt.icon}
              selected={answers.geography === opt.value}
              onClick={() => update("geography", opt.value as Geography)}
            />
          ))}
        </QuestionWrapper>
      )}

      {/* Q4 — Funding stage */}
      {step === 4 && (
        <QuestionWrapper
          stepNumber={4} totalSteps={TOTAL_STEPS}
          title="What stage are you raising at?"
          subtitle="This calibrates valuation assumptions and investor return expectations."
          onNext={handleNext} onBack={handleBack}
          nextDisabled={!canAdvance()}
        >
          {[
            { value: "pre-seed", label: "Pre-seed", desc: "Idea or MVP stage, raising your first capital", icon: "🌱" },
            { value: "seed", label: "Seed", desc: "Early traction, building the team", icon: "🚀" },
            { value: "series-a", label: "Series A", desc: "Proven product-market fit, scaling", icon: "📈" },
            { value: "series-b", label: "Series B+", desc: "Scaling fast, expanding markets", icon: "🏆" },
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
        </QuestionWrapper>
      )}

      {/* Q5 — Pricing tiers */}
      {step === 5 && (
        <QuestionWrapper
          stepNumber={5} totalSteps={TOTAL_STEPS}
          title="How do you make money?"
          subtitle="Start with your subscription pricing tiers (allocation should total 100%). Pro lets you mix in transaction fees, services, ads and more below."
          onNext={handleNext} onBack={handleBack}
          nextDisabled={!canAdvance()}
        >
          <div className="mb-4">
            <Label className="text-gray-500 text-xs uppercase tracking-wider font-semibold">Number of pricing tiers</Label>
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
            <div key={i} className="rounded-xl border border-gray-200 bg-gray-50/60 p-4 space-y-3">
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Tier {i + 1}</p>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <Label className="text-xs text-gray-600 mb-1 block font-medium">Name</Label>
                  <Input
                    placeholder={["Free", "Basic", "Pro", "Enterprise"][i] ?? `Tier ${i + 1}`}
                    value={answers.tiers?.[i]?.name ?? ""}
                    onChange={(e) => updateTier(i, "name", e.target.value || (["Free", "Basic", "Pro", "Enterprise"][i] ?? `Tier ${i + 1}`))}
                    className="text-sm h-9"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-600 mb-1 block font-medium">$/month</Label>
                  <MoneyInput
                    placeholder="49"
                    value={answers.tiers?.[i]?.monthlyPrice || undefined}
                    onValueChange={(v) => updateTier(i, "monthlyPrice", v ?? 0)}
                    className="text-sm h-9"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-600 mb-1 block font-medium">% of users</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    placeholder={String(Math.floor(100 / tierCount))}
                    value={answers.tiers?.[i]?.allocationPercent || ""}
                    onChange={(e) => updateTier(i, "allocationPercent", Number(e.target.value))}
                    className="text-sm h-9"
                  />
                </div>
              </div>
            </div>
          ))}

          <p className="text-xs text-gray-500 mt-2">
            Allocation total: {answers.tiers?.reduce((s, t) => s + (t.allocationPercent || 0), 0) ?? 0}%
            {answers.tiers?.reduce((s, t) => s + (t.allocationPercent || 0), 0) !== 100 && (
              <span className="text-amber-600 ml-1 font-medium">(should total 100%)</span>
            )}
          </p>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <RevenueStreamsEditor
              value={answers.revenueStreams ?? []}
              onChange={(next: RevenueStream[]) => update("revenueStreams", next)}
            />
          </div>
        </QuestionWrapper>
      )}

      {/* Q6 — Acquisition */}
      {step === 6 && (
        <QuestionWrapper
          stepNumber={6} totalSteps={TOTAL_STEPS}
          title="How do you acquire customers?"
          subtitle="Select all that apply, then tell us your cost to acquire a single customer."
          onNext={handleNext} onBack={handleBack}
          nextDisabled={!canAdvance()}
        >
          <div className="grid grid-cols-2 gap-2 mb-4">
            {[
              { value: "paid-ads", label: "Paid Ads", icon: "📢" },
              { value: "seo", label: "SEO / Organic", icon: "🔍" },
              { value: "sales", label: "Sales Team", icon: "📞" },
              { value: "partnerships", label: "Partnerships", icon: "🤝" },
              { value: "word-of-mouth", label: "Word of Mouth", icon: "💬" },
              { value: "product-led", label: "Product-led", icon: "⚡" },
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
                Estimated cost to acquire one customer (CAC) <span className="text-red-500">*</span>
              </Label>
              <MoneyInput
                placeholder="250"
                value={answers.cac}
                onValueChange={(v) => update("cac", v ?? 0)}
              />
              <p className="text-xs text-gray-500 mt-1">All-in cost: ads spend + sales time + tools</p>
            </div>

            {(answers.customerType === "b2b" || answers.customerType === "both") && (
              <div>
                <Label className="text-gray-700 mb-2 block font-medium">Average annual contract value (ACV)</Label>
                <MoneyInput
                  placeholder="2,400"
                  value={answers.acv}
                  onValueChange={(v) => update("acv", v)}
                />
              </div>
            )}

            {(answers.customerType === "b2c" || answers.customerType === "both") && (
              <div>
                <Label className="text-gray-700 mb-2 block font-medium">Average monthly spend per consumer</Label>
                <MoneyInput
                  placeholder="29"
                  value={answers.avgMonthlySpend}
                  onValueChange={(v) => update("avgMonthlySpend", v)}
                />
              </div>
            )}
          </div>
        </QuestionWrapper>
      )}

      {/* Q7 — Churn */}
      {step === 7 && (
        <QuestionWrapper
          stepNumber={7} totalSteps={TOTAL_STEPS}
          title="What's your monthly churn rate?"
          subtitle="The percentage of customers who cancel each month. Lower is better."
          onNext={handleNext} onBack={handleBack}
          nextDisabled={!canAdvance()}
        >
          {[
            { value: "lt2", label: "Less than 2%", desc: "Excellent — enterprise-grade retention", icon: "🟢" },
            { value: "2to5", label: "2–5%", desc: "Good — typical for well-optimised SaaS", icon: "🟡" },
            { value: "5to10", label: "5–10%", desc: "Room for improvement — review onboarding", icon: "🟠" },
            { value: "gt10", label: "Greater than 10%", desc: "High — investigate product-market fit", icon: "🔴" },
            { value: "unknown", label: "Don't know yet", desc: "We'll use 5% as a baseline", icon: "❓" },
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
        </QuestionWrapper>
      )}

      {/* Q8 — Team & costs */}
      {step === 8 && (
        <QuestionWrapper
          stepNumber={8} totalSteps={TOTAL_STEPS}
          title="Tell us about your team and costs"
          onNext={handleNext} onBack={handleBack}
          nextDisabled={!canAdvance()}
        >
          <div>
            <Label className="text-gray-700 mb-3 block font-medium">Current headcount</Label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: "1", label: "Just me (1)" },
                { value: "2–5", label: "2–5 people" },
                { value: "6–15", label: "6–15 people" },
                { value: "15+", label: "15+ people" },
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
              Monthly burn rate — all costs today <span className="text-red-500">*</span>
            </Label>
            <MoneyInput
              placeholder="15,000"
              value={answers.monthlyBurn}
              onValueChange={(v) => update("monthlyBurn", v ?? 0)}
            />
            <p className="text-xs text-gray-500 mt-1">Salaries, tools, office, cloud infra — everything</p>
          </div>
        </QuestionWrapper>
      )}

      {/* Q9 — Growth ambition */}
      {step === 9 && (
        <QuestionWrapper
          stepNumber={9} totalSteps={TOTAL_STEPS}
          title="What's your growth ambition?"
          onNext={handleNext} onBack={handleBack}
          nextDisabled={!canAdvance()}
        >
          <div className="mb-4">
            <Label className="text-gray-700 mb-2 block font-medium">
              Year 1 customer / user target <span className="text-red-500">*</span>
            </Label>
            <MoneyInput
              prefix=""
              placeholder="500"
              value={answers.year1UserTarget}
              onValueChange={(v) => update("year1UserTarget", v ?? 0)}
            />
            <p className="text-xs text-gray-500 mt-1">Total paying customers at end of year one</p>
          </div>

          <div>
            <Label className="text-gray-700 mb-3 block font-medium">Growth scenario</Label>
            {[
              { value: "conservative", label: "Conservative", desc: "~4% monthly growth — realistic, defensible to investors", icon: "🛡️" },
              { value: "base", label: "Base case", desc: "~9% monthly growth — solid execution, strong market", icon: "📊" },
              { value: "aggressive", label: "Aggressive", desc: "~18% monthly growth — high-conviction, viral or paid-heavy", icon: "🚀" },
            ].map((opt) => (
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
        </QuestionWrapper>
      )}

      {/* Q10 — Fundraising ask */}
      {step === 10 && (
        <QuestionWrapper
          stepNumber={10} totalSteps={TOTAL_STEPS}
          title="Tell us about your raise"
          subtitle="The final piece — we'll use this to calculate runway and returns."
          onNext={handleNext} onBack={handleBack}
          nextDisabled={!canAdvance()}
          isLast
        >
          <div>
            <Label className="text-gray-700 mb-2 block font-medium">
              How much are you raising? <span className="text-red-500">*</span>
            </Label>
            <MoneyInput
              placeholder="1,000,000"
              value={answers.fundingAsk}
              onValueChange={(v) => update("fundingAsk", v ?? 0)}
            />
          </div>

          <div className="mt-3">
            <Label className="text-gray-700 mb-3 block font-medium">What will you use it for? (select all)</Label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: "product-dev", label: "Product Development" },
                { value: "hiring", label: "Hiring" },
                { value: "marketing", label: "Marketing & Sales" },
                { value: "operations", label: "Operations" },
                { value: "working-capital", label: "Working Capital" },
              ].map((opt) => {
                const selected = answers.useOfProceeds?.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      const curr = answers.useOfProceeds ?? [];
                      update(
                        "useOfProceeds",
                        selected ? curr.filter((v) => v !== opt.value) : [...curr, opt.value]
                      );
                    }}
                    className={cn(
                      "py-2.5 rounded-xl border text-sm transition-all",
                      selected ? tileOn : tileOff
                    )}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-3">
            <Label className="text-gray-700 mb-3 block font-medium">Target runway from this raise</Label>
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
                  {months}mo
                </button>
              ))}
            </div>
          </div>

          <div className="mt-3">
            <Label className="text-gray-700 mb-2 block font-medium">Company name (optional)</Label>
            <Input
              placeholder="Your startup"
              value={answers.companyName ?? ""}
              onChange={(e) => update("companyName", e.target.value)}
            />
          </div>
        </QuestionWrapper>
      )}
    </div>
  );
}
