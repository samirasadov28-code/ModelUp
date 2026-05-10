"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PLTable } from "@/components/outputs/PLTable";
import { RevenueChart } from "@/components/outputs/RevenueChart";
import { RunwayChart } from "@/components/outputs/RunwayChart";
import { UnitEconomicsDashboard } from "@/components/outputs/UnitEconomicsDashboard";
import { ScenarioComparison } from "@/components/outputs/ScenarioComparison";
import { FundingNarrative } from "@/components/outputs/FundingNarrative";
import { CapTableSummary } from "@/components/outputs/CapTableSummary";
import { ProCapTableWaterfall } from "@/components/outputs/ProCapTableWaterfall";
import { ProValuationPanel } from "@/components/outputs/ProValuationPanel";
import { ValuationCard } from "@/components/outputs/ValuationCard";
import { CashFlowStatementTable } from "@/components/outputs/CashFlowStatementTable";
import { SourcesAndUsesTable } from "@/components/outputs/SourcesAndUsesTable";
import { CalculationsPanel } from "@/components/outputs/CalculationsPanel";
import { SensitivityAnalysis } from "@/components/outputs/SensitivityAnalysis";
import { MetricCard } from "@/components/outputs/MetricCard";
import { TrustBadge } from "@/components/outputs/TrustBadge";
import { ViewModeToggle } from "@/components/ViewModeToggle";
import { EarlyAccessForm } from "@/components/EarlyAccessForm";
import { getModelLocally } from "@/lib/model-client-store";
import { formatCurrencyCompact } from "@/lib/utils";
import { hasEarlyAccess } from "@/lib/early-access";
import { Calculator, Download, Lightbulb, Lock, Sliders, Sparkles } from "lucide-react";
import type { ModelOutputs } from "@/lib/types";

const GATE_ENABLED = process.env.NEXT_PUBLIC_GATE_ENABLED === "true";

export default function FullModelPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const justSubscribed = searchParams.get("subscribed") === "1";

  const [model, setModel] = useState<ModelOutputs | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(!GATE_ENABLED || justSubscribed);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!GATE_ENABLED) return;
    if (hasEarlyAccess()) setIsSubscribed(true);
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

  async function handleExport() {
    setExporting(true);
    try {
      const res = await fetch("/api/model/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modelId: params.id, model }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Export failed");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ModelUp_${model?.answers.companyName ?? "Model"}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Excel export failed.";
      alert(`${message}\n\nTry refreshing the page and downloading again.`);
    } finally {
      setExporting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-full border-2 border-blue-600 border-t-transparent animate-spin mx-auto" />
          <p className="text-gray-500 text-sm">Loading your model…</p>
        </div>
      </div>
    );
  }

  if (!model) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-6">
        <div className="text-center space-y-4">
          <p className="text-gray-900 text-lg font-semibold">Model not found</p>
          <p className="text-gray-500 text-sm max-w-sm">
            Models are stored in your browser. Try returning to the preview page,
            or build a new model.
          </p>
          <Link href="/model/new" className="text-blue-600 text-sm hover:underline font-semibold">
            Build a new model →
          </Link>
        </div>
      </div>
    );
  }

  if (!isSubscribed) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-6 py-12">
        <div className="max-w-lg w-full space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center mx-auto mb-4">
              <Lock className="w-7 h-7 text-blue-600" />
            </div>
            <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Unlock your full model</h1>
            <p className="text-gray-500">
              Get interactive charts, unit economics, scenario comparison, cap table,
              and the populated Excel download.
            </p>
          </div>

          <button
            onClick={async () => {
              const res = await fetch("/api/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ modelId: params.id }),
              });
              const { url } = await res.json();
              if (url) window.location.href = url;
              else alert("Stripe not configured. Set STRIPE_PRICE_ID_PRO_MONTHLY in env vars.");
            }}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold transition-colors shadow-lg shadow-blue-500/20"
          >
            Get Pro — $4.99/mo
          </button>
          <p className="text-center text-xs text-gray-400 -mt-2">Cancel anytime · No commitment</p>

          <EarlyAccessForm onUnlocked={() => setIsSubscribed(true)} />

          <Link
            href={`/model/${params.id}/preview`}
            className="block text-center text-sm text-gray-400 hover:text-gray-700 transition-colors"
          >
            Back to free preview
          </Link>
        </div>
      </div>
    );
  }

  const { annual, monthly, unitEconomics, runway, scenarios, capTable, fundingNarrative, answers, currency } = model;
  const aiInsights = (model as ModelOutputs & { aiInsights?: string[] }).aiInsights ?? [];
  const company = answers.companyName ?? "Your business";
  const fmt = (v: number) => formatCurrencyCompact(v, currency);

  return (
    <main className="min-h-screen bg-white text-gray-900">
      <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <Image src="/Logo_192.png" alt="ModelUp" width={28} height={28} className="rounded-lg" />
            <span className="text-gray-900 font-bold text-lg tracking-tight whitespace-nowrap">
              Model<span className="text-blue-600">Up</span>
            </span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden lg:block">
              <TrustBadge />
            </div>
            <ViewModeToggle modelId={params.id} current="pro" />
            <button
              onClick={handleExport}
              disabled={exporting}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors shadow-sm disabled:opacity-50 whitespace-nowrap"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">{exporting ? "Exporting…" : "Download Excel"}</span>
              <span className="sm:hidden">{exporting ? "…" : "Excel"}</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 text-xs bg-blue-50 text-blue-700 border border-blue-100 px-2.5 py-1 rounded-full font-semibold">
                <Sparkles className="w-3 h-3" />
                Full Model — Pro
              </span>
              <span className="text-xs text-gray-400 capitalize">
                {answers.businessModel} · {answers.fundingStage.replace("-", " ")}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">
              {company} — {annual.length}-Year Financial Model
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Source: {model.sourceModel} · Generated {new Date(model.createdAt).toLocaleDateString()}
            </p>
          </div>
          <p className="text-xs text-gray-400 text-right hidden md:block">
            Open Excel file in Excel or Google Sheets
            <br />
            to auto-calculate formulas.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricCard
            label={`Year ${annual.length} ARR`}
            value={fmt(annual[annual.length - 1].arr)}
            variant="highlight"
            sub="Annual recurring revenue"
          />
          <MetricCard
            label="Runway"
            value={runway.cashPositive ? `${monthly.length}mo+` : `${runway.runwayMonths}mo`}
            sub={`Raise: ${fmt(answers.fundingAsk)}`}
          />
          <MetricCard
            label="Break-even (EBITDA+)"
            value={runway.breakEvenYear ? `Year ${runway.breakEvenYear}` : `Year ${annual.length}+`}
            variant={runway.breakEvenYear ? "success" : "default"}
            sub={runway.breakEvenMonth ? `Month ${runway.breakEvenMonth}` : "Not reached in forecast"}
          />
          <MetricCard
            label="First profitable year"
            value={runway.firstProfitableYear ? `Year ${runway.firstProfitableYear}` : `Year ${annual.length}+`}
            variant={runway.firstProfitableYear ? "success" : "default"}
            sub="Annual net income > 0"
          />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricCard
            label="LTV / CAC"
            value={`${unitEconomics.ltvCacRatio.toFixed(1)}x`}
            variant={
              unitEconomics.cacStatus === "green"
                ? "success"
                : unitEconomics.cacStatus === "amber"
                ? "warning"
                : "default"
            }
            sub={unitEconomics.cacStatus === "green" ? "Healthy ratio" : "Monitor closely"}
          />
          <MetricCard
            label="DCF enterprise value"
            value={fmt(Math.max(0, model.valuation.enterpriseValue))}
            sub={`@ ${(model.valuation.discountRate * 100).toFixed(1)}% discount`}
          />
          <MetricCard
            label="EBITDA multiple value"
            value={fmt(Math.max(0, model.valuation.multipleValuation.baseValuation))}
            sub={`${model.valuation.multipleValuation.baseMultiple}× ${
              model.valuation.multipleValuation.basis === "ebitda" ? "Y" + annual.length + " EBITDA" : "Y" + annual.length + " ARR"
            }`}
          />
        </div>

        <FundingNarrative narrative={fundingNarrative} />

        {aiInsights.length > 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="w-4 h-4 text-amber-600" />
              <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">
                AI Model Insights
              </span>
            </div>
            <div className="space-y-3">
              {aiInsights.map((insight, i) => (
                <div key={i} className="flex items-start gap-3 text-sm text-gray-700">
                  <span className="text-amber-600 font-mono mt-0.5">{i + 1}.</span>
                  {insight}
                </div>
              ))}
            </div>
          </div>
        )}

        <Tabs defaultValue="overview">
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="pl">P&amp;L</TabsTrigger>
            <TabsTrigger value="cash-flow">Cash Flow</TabsTrigger>
            <TabsTrigger value="sources-uses">Sources &amp; Uses</TabsTrigger>
            <TabsTrigger value="unit-econ">Unit Economics</TabsTrigger>
            <TabsTrigger value="scenarios">Scenarios</TabsTrigger>
            <TabsTrigger value="captable">Cap Table</TabsTrigger>
            <TabsTrigger value="valuation">Valuation</TabsTrigger>
            <TabsTrigger value="sensitivity" className="gap-1.5">
              <Sliders className="w-3.5 h-3.5" />
              Sensitivity
            </TabsTrigger>
            <TabsTrigger value="calculations" className="gap-1.5">
              <Calculator className="w-3.5 h-3.5" />
              Calculations
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <RevenueChart monthly={monthly} annual={annual} currency={currency} />
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <RunwayChart monthly={monthly} runway={runway} currency={currency} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="pl">
            <div className="rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/60">
                <h2 className="font-semibold text-gray-900">Income Statement</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  5-year annual projections · {answers.growthCurve} scenario
                </p>
              </div>
              <PLTable annual={annual} currency={currency} />
            </div>
          </TabsContent>

          <TabsContent value="cash-flow">
            <div className="rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/60">
                <h2 className="font-semibold text-gray-900">Cash Flow Statement</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Indirect method · {model.cashFlow.years.length} years · operating + investing + financing
                </p>
              </div>
              <CashFlowStatementTable cashFlow={model.cashFlow} currency={currency} />
            </div>
          </TabsContent>

          <TabsContent value="sources-uses">
            <div className="rounded-xl border border-gray-200 p-6 shadow-sm">
              <h2 className="font-semibold text-gray-900 mb-1">Sources &amp; Uses</h2>
              <p className="text-xs text-gray-500 mb-6">
                Capital coming in versus capital going out — pulled straight from your Q10
                allocation. Must balance.
              </p>
              <SourcesAndUsesTable data={model.sourcesAndUses} currency={currency} />
            </div>
          </TabsContent>

          <TabsContent value="unit-econ">
            <div className="rounded-xl border border-gray-200 p-6 shadow-sm">
              <h2 className="font-semibold text-gray-900 mb-1">Unit Economics</h2>
              <p className="text-xs text-gray-500 mb-6">
                Core metrics for business health and investor readiness
              </p>
              <UnitEconomicsDashboard ue={unitEconomics} currency={currency} />
            </div>
          </TabsContent>

          <TabsContent value="scenarios">
            <div className="rounded-xl border border-gray-200 p-6 shadow-sm">
              <h2 className="font-semibold text-gray-900 mb-1">Scenario Comparison</h2>
              <p className="text-xs text-gray-500 mb-6">
                Conservative vs Base vs Aggressive across key metrics
              </p>
              <ScenarioComparison
                base={scenarios.base}
                conservative={scenarios.conservative}
                aggressive={scenarios.aggressive}
                currency={currency}
              />
            </div>
          </TabsContent>

          <TabsContent value="captable">
            <div className="rounded-xl border border-gray-200 p-6 shadow-sm space-y-6">
              <div>
                <h2 className="font-semibold text-gray-900 mb-1">Cap Table</h2>
                <p className="text-xs text-gray-500">
                  Pre / post-raise ownership for this round.
                </p>
              </div>
              <CapTableSummary capTable={capTable} currency={currency} />
              <div className="pt-4 border-t border-gray-100">
                <h3 className="font-semibold text-gray-900 mb-1">Multi-round dilution waterfall</h3>
                <p className="text-xs text-gray-500 mb-4">
                  Edit pre-seed splits and projected future rounds — the table below shows founder
                  dilution at each stage including ESOP refreshes.
                </p>
                <ProCapTableWaterfall model={model} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="valuation">
            <div className="space-y-4">
              <ValuationCard model={model} />
              <div className="rounded-xl border border-gray-200 p-6 shadow-sm">
                <h2 className="font-semibold text-gray-900 mb-1">Pro WACC build-up</h2>
                <p className="text-xs text-gray-500 mb-6">
                  Refine the discount rate from CAPM + cost of debt; the DCF table and sensitivity
                  matrix below recompute live.
                </p>
                <ProValuationPanel model={model} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="sensitivity">
            <div className="rounded-xl border border-gray-200 p-6 shadow-sm">
              <h2 className="font-semibold text-gray-900 mb-1">Sensitivity analysis</h2>
              <p className="text-xs text-gray-500 mb-6">
                Stress-test every input — burn, CAC, churn, pricing, growth, runway — and see live
                impact on Year-3 ARR, EBITDA, runway, and unit economics.
              </p>
              <SensitivityAnalysis baseModel={model} />
            </div>
          </TabsContent>

          <TabsContent value="calculations">
            <div className="rounded-xl border border-gray-200 p-6 shadow-sm">
              <h2 className="font-semibold text-gray-900 mb-1">Calculations</h2>
              <p className="text-xs text-gray-500 mb-6">
                Every formula behind the model, with your inputs plugged in
              </p>
              <CalculationsPanel model={model} />
            </div>
          </TabsContent>
        </Tabs>

        <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-blue-50/40 to-white px-6 py-4 flex items-center gap-4 shadow-sm">
          <Download className="w-5 h-5 text-blue-600 shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-gray-700">
              <span className="text-gray-900 font-semibold">Excel model ready for download. </span>
              The populated {model.sourceModel} file includes all your inputs injected into the Scen sheet.
              Open in Excel or Google Sheets to auto-calculate every formula.
            </p>
          </div>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
          >
            {exporting ? "…" : "Download .xlsx"}
          </button>
        </div>
      </div>
    </main>
  );
}
