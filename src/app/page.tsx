import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Lightbulb, Zap, DollarSign, BarChart3, TrendingUp, Download } from "lucide-react";
import { VERSION_LABEL } from "@/lib/version";
import { ForceUpdateButton } from "@/components/ForceUpdateButton";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white text-gray-900">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Image src="/Logo_192.png" alt="ModelUp logo" width={32} height={32} className="rounded-lg" />
            <span className="text-gray-900 font-bold text-xl tracking-tight">
              Model<span className="text-violet-600">Up</span>
            </span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/pricing" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
              Pricing
            </Link>
            <Link
              href="/model/new"
              className="inline-flex items-center gap-2 bg-violet-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-violet-700 transition-colors shadow-sm"
            >
              Build your model
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-20 pb-20 text-center">
        <div className="inline-flex items-center gap-2 text-xs bg-violet-50 text-violet-700 border border-violet-100 px-3 py-1.5 rounded-full mb-7 font-medium">
          <Lightbulb className="w-3.5 h-3.5" />
          For founders with bold ideas
        </div>

        <h1 className="text-5xl md:text-6xl font-extrabold leading-tight mb-6 tracking-tight">
          <span className="text-gray-900">Turn your idea into</span>
          <br />
          <span className="bg-gradient-to-r from-violet-600 via-purple-500 to-orange-500 bg-clip-text text-transparent">
            a revenue machine
          </span>
        </h1>

        <p className="text-gray-500 text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
          Every great idea deserves a real financial model. Answer 10 questions and get a
          professional 3-year forecast — in 30 seconds.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/model/new"
            className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-violet-700 text-white px-8 py-4 rounded-xl text-base font-bold hover:from-violet-700 hover:to-violet-800 transition-all shadow-xl shadow-violet-500/25"
          >
            Build your model — it&apos;s free
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            href="/pricing"
            className="inline-flex items-center justify-center gap-2 border border-gray-200 text-gray-600 px-8 py-4 rounded-xl text-base font-medium hover:border-gray-300 hover:text-gray-900 transition-colors"
          >
            See pricing
          </Link>
        </div>

        <p className="text-gray-400 text-sm mt-6">No signup required · Free preview always available</p>
      </section>

      {/* How it works */}
      <section className="bg-gray-50 border-y border-gray-100 py-20">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
            From idea to investor-ready in minutes
          </h2>
          <p className="text-gray-500 text-center mb-14 max-w-xl mx-auto">
            Stop spending weeks on spreadsheets. ModelUp converts your vision into numbers that move investors.
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                icon: <Lightbulb className="w-6 h-6" />,
                iconBg: "bg-violet-100 text-violet-600",
                title: "Describe your idea",
                desc: "10 quick questions about your business model, market, pricing, and growth ambition.",
              },
              {
                step: "02",
                icon: <Zap className="w-6 h-6" />,
                iconBg: "bg-orange-100 text-orange-600",
                title: "Get your model instantly",
                desc: "Our engine builds a 3-year P&L, cash forecast, unit economics, and funding narrative in seconds.",
              },
              {
                step: "03",
                icon: <DollarSign className="w-6 h-6" />,
                iconBg: "bg-emerald-100 text-emerald-600",
                title: "Monetise with confidence",
                desc: "Walk into investor meetings or launch decisions with data-backed projections — not guesses.",
              },
            ].map((s) => (
              <div key={s.step} className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 ${s.iconBg}`}>
                  {s.icon}
                </div>
                <p className="text-xs font-bold text-gray-300 mb-2 tracking-widest">{s.step}</p>
                <h3 className="text-gray-900 font-bold text-lg mb-2">{s.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
            Professional-grade, founder-friendly
          </h2>
          <p className="text-gray-500 text-center mb-14 max-w-xl mx-auto">
            Built on real Excel models used by CFAs and investment analysts — not generic templates.
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: <BarChart3 className="w-5 h-5 text-violet-600" />,
                bg: "bg-violet-50",
                title: "3 growth scenarios",
                desc: "Conservative, base, and aggressive projections so you are ready for any investor question.",
              },
              {
                icon: <TrendingUp className="w-5 h-5 text-orange-600" />,
                bg: "bg-orange-50",
                title: "Real unit economics",
                desc: "CAC, LTV, payback period, and LTV/CAC ratio — the metrics VCs actually interrogate.",
              },
              {
                icon: <Download className="w-5 h-5 text-emerald-600" />,
                bg: "bg-emerald-50",
                title: "Excel download",
                desc: "A fully populated .xlsx with every formula intact. Built to survive due diligence.",
              },
            ].map((f) => (
              <div key={f.title} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className={`w-10 h-10 ${f.bg} rounded-xl flex items-center justify-center mb-4`}>
                  {f.icon}
                </div>
                <h3 className="text-gray-900 font-semibold mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Free vs Pro */}
      <section className="bg-gray-50 border-y border-gray-100 py-20">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Start free, unlock the full model
          </h2>

          <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {/* Free */}
            <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
              <h3 className="text-gray-400 text-xs uppercase tracking-widest font-bold mb-6">Free</h3>
              <div className="space-y-3">
                {["3-year P&L summary", "Cash runway calculation", "Break-even year"].map((item) => (
                  <div key={item} className="flex items-center gap-3 text-sm text-gray-700">
                    <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                    </div>
                    {item}
                  </div>
                ))}
              </div>
            </div>

            {/* Pro */}
            <div className="bg-gradient-to-br from-violet-600 to-purple-800 rounded-2xl p-8 text-white shadow-xl shadow-violet-500/20">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-violet-200 text-xs uppercase tracking-widest font-bold">Pro</h3>
                <span className="text-white font-bold">$9.99/mo</span>
              </div>
              <div className="space-y-3">
                {[
                  "Interactive P&L and cash charts",
                  "CAC, LTV, payback period",
                  "AI funding narrative",
                  "3-scenario comparison",
                  "Cap table with dilution",
                  "Populated Excel download",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3 text-sm text-white/90">
                    <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-orange-300" />
                    </div>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="text-center mt-12">
            <Link
              href="/model/new"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-orange-500 text-white px-8 py-4 rounded-xl text-base font-bold hover:from-violet-700 hover:to-orange-600 transition-all shadow-lg shadow-violet-500/20"
            >
              Start building for free
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-8">
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/Logo_192.png" alt="ModelUp" width={22} height={22} className="rounded" />
            <span className="text-gray-400 text-sm font-medium">
              Model<span className="text-violet-600">Up</span>
            </span>
            <span className="text-gray-300 text-xs font-mono">{VERSION_LABEL}</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/pricing" className="text-gray-400 text-xs hover:text-gray-600 transition-colors">
              Pricing
            </Link>
            <Link href="/model/new" className="text-gray-400 text-xs hover:text-gray-600 transition-colors">
              Build a model
            </Link>
            <ForceUpdateButton />
          </div>
        </div>
      </footer>
    </main>
  );
}
