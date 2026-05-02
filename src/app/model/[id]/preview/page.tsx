"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { PLTable } from "@/components/outputs/PLTable";
import { MetricCard } from "@/components/outputs/MetricCard";
import { UnitEconomicsDashboard } from "@/components/outputs/UnitEconomicsDashboard";
import { TrustBadge } from "@/components/outputs/TrustBadge";
import {
  PreviewTeaser,
  ExampleRevenueChart,
  ExampleCapTable,
} from "@/components/outputs/PreviewTeaser";
import { EarlyAccessForm } from "@/components/EarlyAccessForm";
import { ArrowRight, Sparkles } from "lucide-react";
import { getModelLocally } from "@/lib/model-client-store";
import { formatCurrencyCompact, formatNumber } from "@/lib/utils";
import { hasEarlyAccess } from "@/lib/early-access";
import type { ModelOutputs } from "@/lib/types";

const fmtCurrency = formatCurrencyCompact;

export default function PreviewPage() {
  const params = useParams<{ id: string }>();
  const [model, setModel] = useState<ModelOutputs | null>(null);
  const [loading, setLoading] = useState(true);
  const [earlyAccess, setEarlyAccess] = useState(false);

  useEffect(() => {
    setEarlyAccess(hasEarlyAccess());
  }, []);

  useEffect(() => {
    if (!params.id) return;

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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!model) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-6">
        <div className="text-center space-y-4">
          <p className="text-gray-900 text-lg font-semibold">Model not found</p>
          <p className="text-gray-500 text-sm max-w-sm">
            This model may have expired or been loaded on a different device.
            Models are stored locally in your browser.
          </p>
          <Link href="/model/new" className="text-blue-600 text-sm hover:underline font-semibold">
            Build a new model →
          </Link>
        </div>
      </div>
    );
  }

  const { annual, runway, unitEconomics, answers } = model;
  const company = answers.companyName ?? "Your business";
  const breakEvenText = runway.breakEvenYear ? `Year ${runway.breakEvenYear}` : "Year 3+";
  const upgradeLabel = earlyAccess ? "Open full model" : "Get Pro — $4.99/mo";

  return (
    <main className="min-h-screen bg-white text-gray-900">
      <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <Image src="/Logo_192.png" alt="ModelUp" width={28} height={28} className="rounded-lg" />
            <span className="text-gray-900 font-bold text-lg tracking-tight whitespace-nowrap">
              Model<span className="text-blue-600">Up</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="hidden sm:block">
              <TrustBadge />
            </div>
            <Link
              href={`/model/${params.id}/full`}
              className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors shadow-sm whitespace-nowrap"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {upgradeLabel}
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">
        <div>
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <span className="text-xs bg-blue-50 text-blue-700 border border-blue-100 px-2.5 py-1 rounded-full font-semibold">
              Free Preview
            </span>
            <span className="text-xs text-gray-400">
              {new Date(model.createdAt).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">
            {company} — 3-Year Financial Model
          </h1>
          <p className="text-gray-500 text-sm mt-1 capitalize">
            {answers.businessModel.replace("-", " ")} ·{" "}
            {answers.fundingStage.replace("-", " ")} ·{" "}
            {answers.geography.toUpperCase()}
          </p>
        </div>

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

        <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-blue-50/40 to-white px-6 py-5 shadow-sm">
          <p className="text-gray-500 text-xs font-semibold mb-2 uppercase tracking-wider">Cash Runway</p>
          <p className="text-gray-900 text-lg leading-relaxed">
            At a monthly burn of{" "}
            <span className="text-blue-700 font-semibold">{fmtCurrency(answers.monthlyBurn)}</span>
            , your{" "}
            <span className="text-blue-700 font-semibold">{fmtCurrency(answers.fundingAsk)}</span>{" "}
            raise gives you{" "}
            <span className="text-gray-900 font-semibold">
              {runway.cashPositive ? "over 36 months" : `${runway.runwayMonths} months`}
            </span>{" "}
            of runway.
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/60">
            <h2 className="text-gray-900 font-semibold">3-Year P&amp;L Summary</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Annual projections · {answers.growthCurve} growth scenario
            </p>
          </div>
          <PLTable annual={annual} compact />
        </div>

        {/* Pro teasers — dimmed examples */}
        <div className="grid md:grid-cols-2 gap-4">
          <PreviewTeaser label="Revenue & EBITDA chart">
            <ExampleRevenueChart />
          </PreviewTeaser>
          <PreviewTeaser label="Cap table">
            <ExampleCapTable />
          </PreviewTeaser>
        </div>

        <div className="rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/60 flex items-center justify-between">
            <div>
              <h2 className="text-gray-900 font-semibold">Unit Economics</h2>
              <p className="text-xs text-gray-500 mt-0.5">CAC · LTV · Payback period</p>
            </div>
            <div className="inline-flex items-center gap-1.5 text-xs text-blue-700 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-full font-semibold">
              Pro only
            </div>
          </div>
          <div className="p-6">
            <UnitEconomicsDashboard ue={unitEconomics} blurValues />
          </div>
        </div>

        {/* Upgrade CTA */}
        <div className="rounded-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-8 text-center shadow-xl shadow-blue-500/10">
          <div className="inline-flex items-center gap-2 bg-blue-600 text-white text-xs px-3 py-1.5 rounded-full mb-4 font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            Pro · $4.99/mo
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900 mb-2">
            Unlock your full financial model
          </h2>
          <p className="text-gray-500 text-sm mb-6 max-w-md mx-auto">
            Interactive charts, unit economics, funding narrative, scenario comparison,
            cap table, every formula plugged in with your numbers, and the populated Excel file.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Link
              href={`/model/${params.id}/full`}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-blue-500/25"
            >
              {earlyAccess ? "Open full model" : "Get Pro — $4.99/mo"}
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/pricing"
              className="text-sm text-gray-500 hover:text-gray-900 transition-colors font-medium"
            >
              See what&apos;s included →
            </Link>
          </div>
          <p className="text-xs text-gray-400 mt-4">Cancel anytime · No commitment</p>
        </div>

        {!earlyAccess && (
          <EarlyAccessForm onUnlocked={() => setEarlyAccess(true)} />
        )}
      </div>
    </main>
  );
}
