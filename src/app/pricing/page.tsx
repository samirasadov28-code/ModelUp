import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, Sparkles } from "lucide-react";
import { EarlyAccessForm } from "@/components/EarlyAccessForm";

export const metadata = {
  title: "Pricing — ModelUp",
};

const FREE_FEATURES = [
  "5-year P&L summary table",
  "Cash runway calculation",
  "Break-even year",
  "Model generated in seconds",
];

const PRO_FEATURES = [
  "Everything in Free",
  "Interactive revenue & EBITDA charts",
  "Cash runway area chart",
  "Unit economics dashboard (CAC, LTV, LTV/CAC, payback)",
  "Funding ask narrative (investor-ready paragraph)",
  "3-scenario comparison (Base / Conservative / Aggressive)",
  "Cap table with pre/post-raise ownership",
  "Calculations panel — every formula with your numbers",
  "Populated Excel model download (.xlsx)",
  "Unlimited models",
];

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-white text-gray-900">
      <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/Logo_192.png" alt="ModelUp" width={28} height={28} className="rounded-lg" />
            <span className="text-gray-900 font-bold text-lg tracking-tight">
              Model<span className="text-blue-600">Up</span>
            </span>
          </Link>
          <Link
            href="/model/new"
            className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors shadow-sm"
          >
            Build your model
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-3 tracking-tight">
            Simple, founder-friendly pricing
          </h1>
          <p className="text-gray-500 text-lg">
            Build your financial model free. Unlock the full output for less than a coffee a week.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-1">Free</h2>
              <p className="text-gray-500 text-sm">Build your first model, always free</p>
              <p className="text-3xl font-extrabold text-gray-900 mt-4">$0</p>
            </div>
            <ul className="space-y-3 mb-8">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-3 text-sm text-gray-700">
                  <Check className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/model/new"
              className="block w-full text-center py-3 rounded-xl border border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50 text-sm font-semibold transition-colors"
            >
              Get started free
            </Link>
          </div>

          <div className="rounded-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-8 relative overflow-hidden shadow-xl shadow-blue-500/10">
            <div className="absolute top-4 right-4">
              <span className="text-xs bg-blue-600 text-white px-2.5 py-1 rounded-full font-semibold">
                Most popular
              </span>
            </div>
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <h2 className="text-xl font-bold text-gray-900">Pro</h2>
              </div>
              <p className="text-gray-500 text-sm">Full interactive financial model</p>
              <div className="mt-4">
                <span className="text-3xl font-extrabold text-gray-900">$4.99</span>
                <span className="text-gray-500 text-sm ml-1">/month</span>
              </div>
              <p className="text-xs text-emerald-600 mt-1 font-semibold">Cancel anytime</p>
            </div>
            <ul className="space-y-3 mb-8">
              {PRO_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-3 text-sm text-gray-800">
                  <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/model/new"
              className="block w-full text-center py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors shadow-lg shadow-blue-500/20"
            >
              Get Pro — $4.99/mo
            </Link>
            <p className="text-center text-xs text-gray-400 mt-3">No commitment, cancel anytime</p>
          </div>
        </div>

        <div className="mt-10">
          <EarlyAccessForm />
        </div>

        <div className="mt-16 text-center">
          <p className="text-gray-400 text-sm mb-6">Trusted by founders at</p>
          <div className="flex items-center justify-center gap-8 flex-wrap">
            {["Pre-seed", "Seed", "Series A", "Series B+"].map((stage) => (
              <span key={stage} className="text-gray-300 font-semibold text-sm">
                {stage}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-16 space-y-6 max-w-2xl mx-auto">
          <h2 className="text-xl font-bold text-gray-900 text-center mb-8">Frequently asked</h2>
          {[
            {
              q: "How is this different from a generic template?",
              a: "ModelUp uses professional CFA/FMWC-grade Excel models as the engine. Your inputs are injected into the Scen sheet and the full model recalculates — we don't estimate your numbers, we compute them."
            },
            {
              q: "Can I download the Excel file?",
              a: "Yes — Pro subscribers get the fully populated .xlsx file with all inputs pre-filled. Open in Excel or Google Sheets to review every formula and modify assumptions."
            },
            {
              q: "What business types are supported?",
              a: "SaaS/subscription, marketplace, physical/digital products, service businesses, and capital-intensive businesses (cleantech, infrastructure) via a project finance model."
            },
            {
              q: "Can I build multiple models?",
              a: "Pro subscribers can build unlimited models. Free users can build one model and view the preview."
            },
          ].map(({ q, a }) => (
            <div key={q} className="border-b border-gray-200 pb-6">
              <h3 className="text-gray-900 font-semibold mb-2">{q}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{a}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
