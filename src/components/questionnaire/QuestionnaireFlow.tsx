"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { saveModelLocally } from "@/lib/model-client-store";
import { ProgressBar } from "./ProgressBar";
import { QuestionWrapper } from "./QuestionWrapper";
import { OptionCard } from "./OptionCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type {
  QuestionnaireAnswers,
  BusinessModel,
  CustomerType,
  Geography,
  FundingStage,
  GrowthCurve,
  ChurnEstimate,
  TierConfig,
} from "@/lib/types";

const TOTAL_STEPS = 10;

const DEFAULT_ANSWERS: Partial<QuestionnaireAnswers> = {
  tiers: [],
  acquisitionChannels: [],
  useOfProceeds: [],
  monthlyChurnRate: 0,
  growthCurve: "base",
};

export function QuestionnaireFlow() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState<Partial<QuestionnaireAnswers>>(DEFAULT_ANSWERS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dynamic tier count for Q5
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
    setStep((s) => Math.max(1, s - 1));
  }

  async function handleSubmit() {
    setLoading(true);
    setError(null);
    try {
      // Resolve churn rate from estimate
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

      // Persist full model in localStorage so pages work across Netlify invocations
      if (outputs) saveModelLocally(outputs);

      router.push(`/model/${modelId}/preview`);
    } catch (e) {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-2 border-accent-500/20 animate-ping" />
          <div className="absolute inset-2 rounded-full border-2 border-accent-500 border-t-transparent animate-spin" />
        </div>
        <div className="text-center">
          <p className="text-white font-medium">Building your financial model…</p>
          <p className="text-white/40 text-sm mt-1">Running projections across 3 scenarios</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8">
      <ProgressBar current={step} total={TOTAL_STEPS} />
      {error && (
        <p className="text-red-400 text-sm text-center bg-red-500/10 rounded-lg p-3">
          {error}
        </p>
      )}

      {/* Q1 — Business model */}
      {step === 1 && (
        <QuestionWrapper
          stepNumber={1} totalSteps={TOTAL_STEPS}
          title="What type of business are you building?"
          subtitle="This determines which financial model we use as the foundation."
          onNext={handleNext} onBack={undefined}
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
          title="How do you price your product?"
          subtitle="Define your pricing tiers. Total allocation should add up to 100%."
          onNext={handleNext} onBack={handleBack}
          nextDisabled={!canAdvance()}
        >
          <div className="mb-4">
            <Label className="text-white/60 text-xs uppercase tracking-wider">Number of pricing tiers</Label>
            <div className="flex gap-2 mt-2">
              {[1, 2, 3, 4].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setTierCount(n)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all ${
                    tierCount === n
                      ? "border-accent-500 bg-accent-500/20 text-white"
                      : "border-white/15 text-white/50 hover:border-white/30"
                  }`}
                >
                  {n} tier{n > 1 ? "s" : ""}
                </button>
              ))}
            </div>
          </div>

          {Array.from({ length: tierCount }, (_, i) => (
            <div key={i} className="rounded-xl border border-white/10 bg-navy-900/40 p-4 space-y-3">
              <p className="text-xs text-white/40 font-medium uppercase tracking-wider">Tier {i + 1}</p>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <Label className="text-xs text-white/50 mb-1 block">Name</Label>
                  <Input
                    placeholder={["Free", "Basic", "Pro", "Enterprise"][i] ?? `Tier ${i + 1}`}
                    value={answers.tiers?.[i]?.name ?? ""}
                    onChange={(e) => updateTier(i, "name", e.target.value || (["Free", "Basic", "Pro", "Enterprise"][i] ?? `Tier ${i + 1}`))}
                    className="text-sm h-9"
                  />
                </div>
                <div>
                  <Label className="text-xs text-white/50 mb-1 block">$/month</Label>
                  <Input
                    type="number"
                    min={0}
                    placeholder="49"
                    value={answers.tiers?.[i]?.monthlyPrice || ""}
                    onChange={(e) => updateTier(i, "monthlyPrice", Number(e.target.value))}
                    className="text-sm h-9"
                  />
                </div>
                <div>
                  <Label className="text-xs text-white/50 mb-1 block">% of users</Label>
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

          <p className="text-xs text-white/30 mt-2">
            Allocation total: {answers.tiers?.reduce((s, t) => s + (t.allocationPercent || 0), 0) ?? 0}%
            {answers.tiers?.reduce((s, t) => s + (t.allocationPercent || 0), 0) !== 100 && (
              <span className="text-amber-400 ml-1">(should total 100%)</span>
            )}
          </p>
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
                  className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm transition-all ${
                    selected
                      ? "border-accent-500 bg-accent-500/10 text-white"
                      : "border-white/15 text-white/60 hover:border-white/30"
                  }`}
                >
                  <span>{ch.icon}</span>
                  {ch.label}
                </button>
              );
            })}
          </div>

          <div className="space-y-3">
            <div>
              <Label className="text-white/70 mb-2 block">
                Estimated cost to acquire one customer (CAC) <span className="text-red-400">*</span>
              </Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 text-sm">$</span>
                <Input
                  type="number"
                  min={0}
                  placeholder="250"
                  value={answers.cac || ""}
                  onChange={(e) => update("cac", Number(e.target.value))}
                  className="pl-8"
                />
              </div>
              <p className="text-xs text-white/30 mt-1">All-in cost: ads spend + sales time + tools</p>
            </div>

            {(answers.customerType === "b2b" || answers.customerType === "both") && (
              <div>
                <Label className="text-white/70 mb-2 block">Average annual contract value (ACV)</Label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 text-sm">$</span>
                  <Input
                    type="number"
                    min={0}
                    placeholder="2400"
                    value={answers.acv || ""}
                    onChange={(e) => update("acv", Number(e.target.value))}
                    className="pl-8"
                  />
                </div>
              </div>
            )}

            {(answers.customerType === "b2c" || answers.customerType === "both") && (
              <div>
                <Label className="text-white/70 mb-2 block">Average monthly spend per consumer</Label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 text-sm">$</span>
                  <Input
                    type="number"
                    min={0}
                    placeholder="29"
                    value={answers.avgMonthlySpend || ""}
                    onChange={(e) => update("avgMonthlySpend", Number(e.target.value))}
                    className="pl-8"
                  />
                </div>
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
            <Label className="text-white/70 mb-3 block">Current headcount</Label>
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
                  className={`py-3 rounded-xl border text-sm font-medium transition-all ${
                    answers.headcount === opt.value
                      ? "border-accent-500 bg-accent-500/10 text-white"
                      : "border-white/15 text-white/60 hover:border-white/30"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <Label className="text-white/70 mb-2 block">
              Monthly burn rate — all costs today <span className="text-red-400">*</span>
            </Label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 text-sm">$</span>
              <Input
                type="number"
                min={0}
                placeholder="15000"
                value={answers.monthlyBurn || ""}
                onChange={(e) => update("monthlyBurn", Number(e.target.value))}
                className="pl-8"
              />
            </div>
            <p className="text-xs text-white/30 mt-1">Salaries, tools, office, cloud infra — everything</p>
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
            <Label className="text-white/70 mb-2 block">
              Year 1 customer / user target <span className="text-red-400">*</span>
            </Label>
            <Input
              type="number"
              min={1}
              placeholder="500"
              value={answers.year1UserTarget || ""}
              onChange={(e) => update("year1UserTarget", Number(e.target.value))}
            />
            <p className="text-xs text-white/30 mt-1">Total paying customers at end of year one</p>
          </div>

          <div>
            <Label className="text-white/70 mb-3 block">Growth scenario</Label>
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
            <Label className="text-white/70 mb-2 block">
              How much are you raising? <span className="text-red-400">*</span>
            </Label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 text-sm">$</span>
              <Input
                type="number"
                min={0}
                placeholder="1000000"
                value={answers.fundingAsk || ""}
                onChange={(e) => update("fundingAsk", Number(e.target.value))}
                className="pl-8"
              />
            </div>
          </div>

          <div className="mt-3">
            <Label className="text-white/70 mb-3 block">What will you use it for? (select all)</Label>
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
                    className={`py-2.5 rounded-xl border text-sm transition-all ${
                      selected
                        ? "border-accent-500 bg-accent-500/10 text-white"
                        : "border-white/15 text-white/60 hover:border-white/30"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-3">
            <Label className="text-white/70 mb-3 block">Target runway from this raise</Label>
            <div className="grid grid-cols-4 gap-2">
              {[12, 18, 24, 36].map((months) => (
                <button
                  key={months}
                  type="button"
                  onClick={() => update("targetRunway", months as 12 | 18 | 24 | 36)}
                  className={`py-2.5 rounded-xl border text-sm font-medium transition-all ${
                    answers.targetRunway === months
                      ? "border-accent-500 bg-accent-500/10 text-white"
                      : "border-white/15 text-white/60 hover:border-white/30"
                  }`}
                >
                  {months}mo
                </button>
              ))}
            </div>
          </div>

          <div className="mt-3">
            <Label className="text-white/70 mb-2 block">Company name (optional)</Label>
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
