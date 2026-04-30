"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { PLTable } from "@/components/outputs/PLTable";
import { MetricCard } from "@/components/outputs/MetricCard";
import { UnitEconomicsDashboard } from "@/components/outputs/UnitEconomicsDashboard";
import { TrustBadge } from "@/components/outputs/TrustBadge";
import { Lock, ArrowRight, Zap } from "lucide-react";
import { getModelLocally } from "@/lib/model-client-store";
import { formatCurrencyCompact, formatNumber } from "@/lib/utils";
import type { ModelOutputs } from "@/lib/types";

const fmtCurrency = formatCurrencyCompact;

export default function PreviewPage() {
  const params = useParams<{ id: string }>();
  const [model, setModel] = useState<ModelOutputs | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!params.id) return;

    // Try localStorage first (Netlify-safe), then fall back to API
    const local = getModelLocally(params.id);
    if (local) {
      setModel(local);
      setLoading(false);
      return;
    }

    fetch(`/api/model/${params.id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        setModel(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-navy-900 flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-accent-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!model) {
    return (
      <div className="min-h-screen bg-navy-900 flex items-center justify-center px-6">
        <div className="text-center space-y-4">
          <p className="text-white text-lg font-semibold">Model not found</p>
          <p className="text-white/40 text-sm max-w-sm">
            This model may have expired or been loaded on a different device.
            Models are stored locally in your browser.
          </p>
          <Link href="/model/new" className="text-accent-400 text-sm hover:underline">
            Build a new model →
          </Link>
        </div>
      </div>
    );
  }

  const { annual, runway, unitEconomics, answers } = model;
  const company = answers.companyName ?? "Your business";
  const breakEvenText = runway.breakEvenYear ? `Year ${runway.breakEvenYear}` : "Year 3+";

  return (
    <main className="min-h-screen bg-navy-900 text-white">
      {/* Header */}
      <div className="border-b border-white/8">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="/" className="text-white font-semibold text-lg tracking-tight">
            Model<span className="text-accent-500">Up</span>
          </a>
          <div className="flex items-center gap-4">
            <TrustBadge />
            <Link
              href={`/model/${params.id}/full`}
              className="inline-flex items-center gap-2 bg-accent-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-accent-600 transition-colors"
            >
              <Zap className="w-4 h-4" />
              Unlock Full Model
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">
        {/* Title */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-xs bg-accent-500/20 text-accent-400 border border-accent-500/30 px-2.5 py-1 rounded-full font-medium">
              Free Preview
            </span>
            <span className="text-xs text-white/30">
              {new Date(model.createdAt).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white">
            {company} — 3-Year Financial Model
          </h1>
          <p className="text-white/40 text-sm mt-1 capitalize">
            {answers.businessModel.replace("-", " ")} ·{" "}
            {answers.fundingStage.replace("-", " ")} ·{" "}
            {answers.geography.toUpperCase()}
          </p>
        </div>

        {/* Key metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricCard
            label="Year 3 ARR"
            value={fmtCurrency(annual[2].arr)}
            sub="Annual recurring revenue"
            variant="highlight"
          />
          <MetricCard
            label="Cash Runway"
            value={runway.cashPositive ? "36mo+" : `${runway.runwayMonths}mo`}
            sub={`Raise: ${fmtCurrency(answers.fundingAsk)}`}
          />
          <MetricCard
            label="Break-even"
            value={breakEvenText}
            sub="EBITDA positive"
            variant={runway.breakEvenYear ? "success" : "default"}
          />
          <MetricCard
            label="Year 3 Customers"
            value={formatNumber(annual[2].endingUsers)}
            sub="Paying customers (EoY)"
          />
        </div>

        {/* Runway callout */}
        <div className="rounded-xl border border-white/10 bg-white/3 px-6 py-5">
          <p className="text-white/50 text-sm font-medium mb-1">Cash Runway</p>
          <p className="text-white text-lg leading-relaxed">
            At a monthly burn of{" "}
            <span className="text-accent-400 font-semibold">{fmtCurrency(answers.monthlyBurn)}</span>
            , your{" "}
            <span className="text-accent-400 font-semibold">{fmtCurrency(answers.fundingAsk)}</span>{" "}
            raise gives you{" "}
            <span className="text-white font-semibold">
              {runway.cashPositive ? "over 36 months" : `${runway.runwayMonths} months`}
            </span>{" "}
            of runway.
          </p>
        </div>

        {/* 3-Year P&L Table */}
        <div className="rounded-xl border border-white/10 overflow-hidden">
          <div className="px-6 py-4 border-b border-white/8">
            <h2 className="text-white font-semibold">3-Year P&amp;L Summary</h2>
            <p className="text-xs text-white/40 mt-0.5">
              Annual projections · {answers.growthCurve} growth scenario
            </p>
          </div>
          <PLTable annual={annual} compact />
        </div>

        {/* Unit Economics — blurred */}
        <div className="rounded-xl border border-white/10 overflow-hidden">
          <div className="px-6 py-4 border-b border-white/8 flex items-center justify-between">
            <div>
              <h2 className="text-white font-semibold">Unit Economics</h2>
              <p className="text-xs text-white/40 mt-0.5">CAC · LTV · Payback period</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-white/40">
              <Lock className="w-3.5 h-3.5" />
              Pro only
            </div>
          </div>
          <div className="p-6">
            <UnitEconomicsDashboard ue={unitEconomics} blurValues />
          </div>
        </div>

        {/* Upgrade CTA */}
        <div className="rounded-xl border border-accent-500/30 bg-gradient-to-br from-accent-500/10 to-navy-800/60 p-8 text-center">
          <div className="inline-flex items-center gap-2 bg-accent-500/20 text-accent-400 text-xs px-3 py-1.5 rounded-full border border-accent-500/30 mb-4">
            <Zap className="w-3.5 h-3.5" />
            7-day free trial · Cancel anytime
          </div>
          <h2 className="text-xl font-bold text-white mb-2">
            Unlock your full financial model
          </h2>
          <p className="text-white/50 text-sm mb-6 max-w-sm mx-auto">
            Interactive charts, unit economics, funding narrative, scenario comparison,
            cap table, and Excel download.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Link
              href={`/model/${params.id}/full`}
              className="inline-flex items-center gap-2 bg-accent-500 text-white px-8 py-3 rounded-xl text-sm font-semibold hover:bg-accent-600 transition-colors shadow-lg shadow-accent-500/20"
            >
              Start free trial — $9.99/mo
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/pricing"
              className="text-sm text-white/40 hover:text-white/70 transition-colors"
            >
              See what&apos;s included →
            </Link>
          </div>
          <p className="text-xs text-white/25 mt-4">No credit card required during trial</p>
        </div>
      </div>
    </main>
  );
}
