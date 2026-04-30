"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PLTable } from "@/components/outputs/PLTable";
import { RevenueChart } from "@/components/outputs/RevenueChart";
import { RunwayChart } from "@/components/outputs/RunwayChart";
import { UnitEconomicsDashboard } from "@/components/outputs/UnitEconomicsDashboard";
import { ScenarioComparison } from "@/components/outputs/ScenarioComparison";
import { FundingNarrative } from "@/components/outputs/FundingNarrative";
import { CapTableSummary } from "@/components/outputs/CapTableSummary";
import { MetricCard } from "@/components/outputs/MetricCard";
import { TrustBadge } from "@/components/outputs/TrustBadge";
import { getModelLocally } from "@/lib/model-client-store";
import { formatCurrencyCompact } from "@/lib/utils";
import { Download, Lightbulb, Lock, Zap } from "lucide-react";
import type { ModelOutputs } from "@/lib/types";

const fmtCurrency = formatCurrencyCompact;

// In production, read subscription status from session/Supabase.
// For MVP on Netlify, we enable full view for all visitors.
const GATE_ENABLED = process.env.NEXT_PUBLIC_GATE_ENABLED === "true";

export default function FullModelPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const justSubscribed = searchParams.get("subscribed") === "1";

  const [model, setModel] = useState<ModelOutputs | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubscribed] = useState(!GATE_ENABLED || justSubscribed);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!params.id) return;

    // localStorage first (Netlify-safe), then API fallback
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
        body: JSON.stringify({ modelId: params.id }),
      });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ModelUp_${model?.answers.companyName ?? "Model"}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert(
        "Excel export requires the Python microservice.\n\n" +
          "Run it locally:\n  cd excel-service && pip install -r requirements.txt && uvicorn main:app\n\n" +
          "Or deploy to Railway/Fly.io and set PYTHON_SERVICE_URL."
      );
    } finally {
      setExporting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-navy-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-full border-2 border-accent-500 border-t-transparent animate-spin mx-auto" />
          <p className="text-white/50 text-sm">Loading your model…</p>
        </div>
      </div>
    );
  }

  if (!model) {
    return (
      <div className="min-h-screen bg-navy-900 flex items-center justify-center px-6">
        <div className="text-center space-y-4">
          <p className="text-white text-lg font-semibold">Model not found</p>
          <p className="text-white/40 text-sm max-w-sm">
            Models are stored in your browser. Try returning to the preview page,
            or build a new model.
          </p>
          <Link href="/model/new" className="text-accent-400 text-sm hover:underline">
            Build a new model →
          </Link>
        </div>
      </div>
    );
  }

  if (!isSubscribed) {
    return (
      <div className="min-h-screen bg-navy-900 flex items-center justify-center px-6">
        <div className="max-w-md text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-accent-500/10 border border-accent-500/30 flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7 text-accent-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Unlock your full model</h1>
          <p className="text-white/50">
            Get interactive charts, unit economics, scenario comparison, cap table,
            and Excel download.
          </p>
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
            className="w-full bg-accent-500 text-white py-3 rounded-xl font-semibold hover:bg-accent-600 transition-colors"
          >
            Start 7-day free trial — $9.99/mo
          </button>
          <Link
            href={`/model/${params.id}/preview`}
            className="block text-sm text-white/30 hover:text-white/60 transition-colors"
          >
            Back to free preview
          </Link>
        </div>
      </div>
    );
  }

  const { annual, monthly, unitEconomics, runway, scenarios, capTable, fundingNarrative, answers } = model;
  const aiInsights = (model as ModelOutputs & { aiInsights?: string[] }).aiInsights ?? [];
  const company = answers.companyName ?? "Your business";

  return (
    <main className="min-h-screen bg-navy-900 text-white">
      {/* Sticky header */}
      <div className="border-b border-white/8 sticky top-0 z-20 bg-navy-900/95 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="/" className="text-white font-semibold text-lg tracking-tight">
            Model<span className="text-accent-500">Up</span>
          </a>
          <div className="flex items-center gap-3">
            <TrustBadge />
            <button
              onClick={handleExport}
              disabled={exporting}
              className="inline-flex items-center gap-2 bg-white/8 text-white/80 hover:bg-white/15 px-4 py-2 rounded-lg text-sm font-medium border border-white/10 transition-colors disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {exporting ? "Exporting…" : "Download Excel"}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Title row */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="inline-flex items-center gap-1.5 text-xs bg-accent-500/20 text-accent-400 border border-accent-500/30 px-2.5 py-1 rounded-full font-medium">
                <Zap className="w-3 h-3" />
                Full Model — Pro
              </span>
              <span className="text-xs text-white/30 capitalize">
                {answers.businessModel} · {answers.fundingStage.replace("-", " ")}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white">{company} — 3-Year Financial Model</h1>
            <p className="text-white/40 text-sm mt-1">
              Source: {model.sourceModel} · Generated {new Date(model.createdAt).toLocaleDateString()}
            </p>
          </div>
          <p className="text-xs text-white/25 text-right hidden md:block">
            Open Excel file in Excel or Google Sheets
            <br />
            to auto-calculate formulas.
          </p>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricCard
            label="Year 3 ARR"
            value={fmtCurrency(annual[2].arr)}
            variant="highlight"
            sub="Annual recurring revenue"
          />
          <MetricCard
            label="Runway"
            value={runway.cashPositive ? "36mo+" : `${runway.runwayMonths}mo`}
            sub={`Raise: ${fmtCurrency(answers.fundingAsk)}`}
          />
          <MetricCard
            label="Break-even"
            value={runway.breakEvenYear ? `Year ${runway.breakEvenYear}` : "Year 3+"}
            variant={runway.breakEvenYear ? "success" : "default"}
            sub="EBITDA positive"
          />
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
        </div>

        {/* AI Funding Narrative */}
        <FundingNarrative narrative={fundingNarrative} />

        {/* AI Insights */}
        {aiInsights.length > 0 && (
          <div className="rounded-xl border border-white/10 bg-white/3 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                AI Model Insights
              </span>
            </div>
            <div className="space-y-3">
              {aiInsights.map((insight, i) => (
                <div key={i} className="flex items-start gap-3 text-sm text-white/70">
                  <span className="text-white/20 font-mono mt-0.5">{i + 1}.</span>
                  {insight}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main tabs */}
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="pl">P&amp;L</TabsTrigger>
            <TabsTrigger value="unit-econ">Unit Economics</TabsTrigger>
            <TabsTrigger value="scenarios">Scenarios</TabsTrigger>
            <TabsTrigger value="captable">Cap Table</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="rounded-xl border border-white/10 bg-navy-800/40 p-6">
                <RevenueChart monthly={monthly} annual={annual} />
              </div>
              <div className="rounded-xl border border-white/10 bg-navy-800/40 p-6">
                <RunwayChart monthly={monthly} runway={runway} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="pl">
            <div className="rounded-xl border border-white/10 overflow-hidden">
              <div className="px-6 py-4 border-b border-white/8">
                <h2 className="font-semibold text-white">Income Statement</h2>
                <p className="text-xs text-white/40 mt-0.5">
                  3-year annual projections · {answers.growthCurve} scenario
                </p>
              </div>
              <PLTable annual={annual} />
            </div>
          </TabsContent>

          <TabsContent value="unit-econ">
            <div className="rounded-xl border border-white/10 p-6">
              <h2 className="font-semibold text-white mb-1">Unit Economics</h2>
              <p className="text-xs text-white/40 mb-6">
                Core metrics for business health and investor readiness
              </p>
              <UnitEconomicsDashboard ue={unitEconomics} />
            </div>
          </TabsContent>

          <TabsContent value="scenarios">
            <div className="rounded-xl border border-white/10 p-6">
              <h2 className="font-semibold text-white mb-1">Scenario Comparison</h2>
              <p className="text-xs text-white/40 mb-6">
                Conservative vs Base vs Aggressive across key metrics
              </p>
              <ScenarioComparison
                base={scenarios.base}
                conservative={scenarios.conservative}
                aggressive={scenarios.aggressive}
              />
            </div>
          </TabsContent>

          <TabsContent value="captable">
            <div className="rounded-xl border border-white/10 p-6">
              <h2 className="font-semibold text-white mb-1">Cap Table</h2>
              <p className="text-xs text-white/40 mb-6">
                Pre/post-raise ownership structure
              </p>
              <CapTableSummary capTable={capTable} />
            </div>
          </TabsContent>
        </Tabs>

        {/* Excel download CTA */}
        <div className="rounded-xl border border-white/8 bg-white/3 px-6 py-4 flex items-center gap-4">
          <Download className="w-5 h-5 text-white/30 shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-white/70">
              <span className="text-white font-medium">Excel model ready for download. </span>
              The populated {model.sourceModel} file includes all your inputs injected into the Scen sheet.
              Open in Excel or Google Sheets to auto-calculate every formula.
            </p>
          </div>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="shrink-0 bg-accent-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-accent-600 transition-colors disabled:opacity-50"
          >
            {exporting ? "…" : "Download .xlsx"}
          </button>
        </div>
      </div>
    </main>
  );
}
