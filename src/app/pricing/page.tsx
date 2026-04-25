import Link from "next/link";
import { Check, Zap } from "lucide-react";

export const metadata = {
  title: "Pricing — ModelUp",
};

const FREE_FEATURES = [
  "3-year P&L summary table",
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
  "Populated Excel model download (.xlsx)",
  "Unlimited models",
  "7-day free trial",
];

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-navy-900 text-white">
      {/* Header */}
      <div className="border-b border-white/8">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="/" className="text-white font-semibold text-lg tracking-tight">
            Model<span className="text-accent-500">Up</span>
          </a>
          <Link
            href="/model/new"
            className="text-sm text-accent-400 hover:text-accent-300 transition-colors"
          >
            Build a model →
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-3">
            Simple, founder-friendly pricing
          </h1>
          <p className="text-white/50 text-lg">
            Build your financial model free. Unlock the full output for less than a coffee a week.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Free tier */}
          <div className="rounded-2xl border border-white/10 bg-navy-800/40 p-8">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-white mb-1">Free</h2>
              <p className="text-white/40 text-sm">Build your first model, always free</p>
              <p className="text-3xl font-bold text-white mt-4">$0</p>
            </div>
            <ul className="space-y-3 mb-8">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-3 text-sm text-white/70">
                  <Check className="w-4 h-4 text-white/40 shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/model/new"
              className="block w-full text-center py-3 rounded-xl border border-white/15 text-white/70 hover:border-white/30 hover:text-white text-sm font-medium transition-colors"
            >
              Get started free
            </Link>
          </div>

          {/* Pro tier */}
          <div className="rounded-2xl border border-accent-500/40 bg-gradient-to-b from-accent-500/10 to-navy-800/60 p-8 relative overflow-hidden">
            <div className="absolute top-4 right-4">
              <span className="text-xs bg-accent-500 text-white px-2.5 py-1 rounded-full font-medium">
                Most popular
              </span>
            </div>
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-4 h-4 text-accent-400" />
                <h2 className="text-xl font-bold text-white">Pro</h2>
              </div>
              <p className="text-white/40 text-sm">Full interactive financial model</p>
              <div className="mt-4">
                <span className="text-3xl font-bold text-white">$9.99</span>
                <span className="text-white/40 text-sm ml-1">/month</span>
              </div>
              <p className="text-xs text-emerald-400 mt-1">7-day free trial · Cancel anytime</p>
            </div>
            <ul className="space-y-3 mb-8">
              {PRO_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-3 text-sm text-white/80">
                  <Check className="w-4 h-4 text-accent-400 shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/model/new"
              className="block w-full text-center py-3 rounded-xl bg-accent-500 hover:bg-accent-600 text-white text-sm font-semibold transition-colors shadow-lg shadow-accent-500/20"
            >
              Start free trial
            </Link>
            <p className="text-center text-xs text-white/25 mt-3">No credit card required during trial</p>
          </div>
        </div>

        {/* Trust section */}
        <div className="mt-16 text-center">
          <p className="text-white/25 text-sm mb-6">Trusted by founders at</p>
          <div className="flex items-center justify-center gap-8 flex-wrap">
            {["Pre-seed", "Seed", "Series A", "Series B+"].map((stage) => (
              <span key={stage} className="text-white/20 font-medium text-sm">
                {stage}
              </span>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-16 space-y-6 max-w-2xl mx-auto">
          <h2 className="text-xl font-bold text-white text-center mb-8">Frequently asked</h2>
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
            <div key={q} className="border-b border-white/8 pb-6">
              <h3 className="text-white font-medium mb-2">{q}</h3>
              <p className="text-white/50 text-sm leading-relaxed">{a}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
