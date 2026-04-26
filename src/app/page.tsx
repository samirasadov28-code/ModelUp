import Link from "next/link";
import { ArrowRight, BarChart3, Download, Shield, Zap } from "lucide-react";
import { VERSION_LABEL } from "@/lib/version";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-navy-900 text-white">
      {/* Nav */}
      <nav className="border-b border-white/8">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="text-white font-semibold text-xl tracking-tight">
            Model<span className="text-accent-500">Up</span>
          </span>
          <div className="flex items-center gap-6">
            <Link href="/pricing" className="text-sm text-white/50 hover:text-white transition-colors">
              Pricing
            </Link>
            <Link
              href="/model/new"
              className="inline-flex items-center gap-2 bg-accent-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-accent-600 transition-colors"
            >
              Build your model
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 text-xs bg-accent-500/10 text-accent-400 border border-accent-500/20 px-3 py-1.5 rounded-full mb-6">
          <Shield className="w-3.5 h-3.5" />
          CFA / FMWC-grade financial models · 10 questions · 30 seconds
        </div>

        <h1 className="text-5xl md:text-6xl font-bold text-white leading-tight mb-6">
          Your fundraising model,{" "}
          <span className="text-accent-500">built in seconds</span>
        </h1>

        <p className="text-white/50 text-xl max-w-2xl mx-auto mb-10">
          Answer 10 questions about your startup. Get a professional 3-year financial model
          that investors actually respect — backed by real Excel models, not guesswork.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/model/new"
            className="inline-flex items-center justify-center gap-2 bg-accent-500 text-white px-8 py-4 rounded-xl text-base font-semibold hover:bg-accent-600 transition-colors shadow-xl shadow-accent-500/20"
          >
            Build your model — it&apos;s free
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            href="/pricing"
            className="inline-flex items-center justify-center gap-2 border border-white/15 text-white/70 px-8 py-4 rounded-xl text-base font-medium hover:border-white/30 hover:text-white transition-colors"
          >
            See pricing
          </Link>
        </div>

        <p className="text-white/25 text-sm mt-6">No signup required · Free preview always available</p>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: <Zap className="w-5 h-5 text-accent-400" />,
              title: "Real models, not templates",
              desc: "Built on professional Excel models used by CFAs and investment analysts. Not a generic spreadsheet.",
            },
            {
              icon: <BarChart3 className="w-5 h-5 text-accent-400" />,
              title: "Full dashboard (Pro)",
              desc: "Interactive charts, unit economics, scenario comparison, cap table, and funding narrative.",
            },
            {
              icon: <Download className="w-5 h-5 text-accent-400" />,
              title: "Excel download (Pro)",
              desc: "Get the fully populated .xlsx with all your inputs. Open in Excel to review every formula.",
            },
          ].map((f) => (
            <div key={f.title} className="rounded-xl border border-white/10 bg-navy-800/40 p-6">
              <div className="w-9 h-9 rounded-lg bg-accent-500/10 border border-accent-500/20 flex items-center justify-center mb-4">
                {f.icon}
              </div>
              <h3 className="text-white font-semibold mb-2">{f.title}</h3>
              <p className="text-white/45 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* What you get */}
      <section className="border-t border-white/8 py-16">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-white text-center mb-10">
            What you get from 10 questions
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-white/50 text-xs uppercase tracking-wider font-semibold">Free</h3>
              {["3-year P&L summary", "Cash runway calculation", "Break-even year"].map((item) => (
                <div key={item} className="flex items-center gap-3 text-sm text-white/70">
                  <div className="w-1.5 h-1.5 rounded-full bg-white/30" />
                  {item}
                </div>
              ))}
            </div>
            <div className="space-y-4">
              <h3 className="text-accent-400 text-xs uppercase tracking-wider font-semibold">Pro — $9.99/mo</h3>
              {[
                "Interactive P&L and cash charts",
                "CAC, LTV, LTV/CAC, payback period",
                "Investor-ready funding narrative",
                "3-scenario comparison",
                "Cap table with dilution",
                "Populated Excel download",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 text-sm text-white/80">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent-500" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="text-center mt-12">
            <Link
              href="/model/new"
              className="inline-flex items-center gap-2 bg-accent-500 text-white px-8 py-3.5 rounded-xl text-sm font-semibold hover:bg-accent-600 transition-colors"
            >
              Start for free
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/8 py-8">
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-white/30 text-sm">
              Model<span className="text-accent-500/50">Up</span>
            </span>
            <span className="text-white/15 text-xs font-mono">{VERSION_LABEL}</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/pricing" className="text-white/30 text-xs hover:text-white/60 transition-colors">
              Pricing
            </Link>
            <Link href="/model/new" className="text-white/30 text-xs hover:text-white/60 transition-colors">
              Build a model
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
