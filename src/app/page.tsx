import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Lightbulb, Zap, DollarSign, BarChart3, TrendingUp, Download, Sparkles } from "lucide-react";
import { VERSION_LABEL } from "@/lib/version";
import { ForceUpdateButton } from "@/components/ForceUpdateButton";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white text-gray-900">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <Image src="/Logo_192.png" alt="ModelUp logo" width={28} height={28} className="rounded-lg" />
            <span className="text-gray-900 font-bold text-lg sm:text-xl tracking-tight whitespace-nowrap">
              Model<span className="text-blue-600">Up</span>
            </span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Link
              href="/pricing"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-100 px-3 py-1.5 rounded-full transition-colors whitespace-nowrap"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Pro · $9.99/mo
            </Link>
            <Link
              href="/model/new"
              className="inline-flex items-center gap-1.5 bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm whitespace-nowrap"
            >
              Build your model
              <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 text-xs bg-blue-50 text-blue-700 border border-blue-100 px-3 py-1.5 rounded-full mb-7 font-medium">
          <Lightbulb className="w-3.5 h-3.5" />
          For founders with bold ideas
        </div>

        <h1 className="text-5xl md:text-6xl font-extrabold leading-tight mb-6 tracking-tight">
          <span className="text-gray-900">Turn your idea into</span>
          <br />
          <span className="bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-500 bg-clip-text text-transparent">
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
            className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-4 rounded-xl text-base font-bold hover:from-blue-700 hover:to-blue-800 transition-all shadow-xl shadow-blue-500/25"
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

      {/* Live model preview */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="relative rounded-3xl border border-gray-200 bg-gradient-to-br from-blue-50 via-white to-emerald-50 p-6 md:p-10 shadow-2xl shadow-blue-500/10 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl pointer-events-none" />
          <div className="relative">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-blue-600 mb-1">Example model</p>
                <h3 className="text-xl md:text-2xl font-bold text-gray-900">Acme SaaS · Base scenario</h3>
              </div>
              <span className="text-xs bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full font-semibold">
                Generated in 28s
              </span>
            </div>

            {/* KPI cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
              {[
                { label: "Year 3 ARR", value: "$4.2M", trend: "+312%", color: "text-blue-600" },
                { label: "Gross margin", value: "78%", trend: "+5pp", color: "text-emerald-600" },
                { label: "LTV / CAC", value: "4.6x", trend: "Healthy", color: "text-cyan-600" },
                { label: "Cash runway", value: "22 mo", trend: "Break-even Y2", color: "text-orange-600" },
              ].map((k) => (
                <div key={k.label} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                  <p className="text-xs text-gray-500 mb-1">{k.label}</p>
                  <p className="text-xl md:text-2xl font-bold text-gray-900">{k.value}</p>
                  <p className={`text-xs font-semibold mt-1 ${k.color}`}>{k.trend}</p>
                </div>
              ))}
            </div>

            <div className="grid md:grid-cols-5 gap-4">
              {/* Revenue chart */}
              <div className="md:col-span-3 bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-semibold text-gray-900">Revenue forecast</p>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500" />Revenue</span>
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" />EBITDA</span>
                  </div>
                </div>
                <svg viewBox="0 0 320 140" className="w-full h-36">
                  {/* Grid */}
                  {[0, 1, 2, 3].map((i) => (
                    <line key={i} x1="0" x2="320" y1={20 + i * 30} y2={20 + i * 30} stroke="#f3f4f6" strokeWidth="1" />
                  ))}
                  {/* Revenue bars */}
                  {[
                    { x: 30, h: 30, lh: 12 },
                    { x: 80, h: 55, lh: 22 },
                    { x: 130, h: 78, lh: 38 },
                    { x: 180, h: 95, lh: 55 },
                    { x: 230, h: 110, lh: 70 },
                    { x: 280, h: 125, lh: 85 },
                  ].map((b, i) => (
                    <g key={i}>
                      <rect x={b.x - 14} y={130 - b.h} width="12" height={b.h} rx="2" fill="#3b82f6" />
                      <rect x={b.x} y={130 - b.lh} width="12" height={b.lh} rx="2" fill="#10b981" />
                    </g>
                  ))}
                  {/* X labels */}
                  {["Q1·Y1", "Q3·Y1", "Q1·Y2", "Q3·Y2", "Q1·Y3", "Q3·Y3"].map((l, i) => (
                    <text key={l} x={30 + i * 50 - 7} y="138" fontSize="7" fill="#9ca3af">{l}</text>
                  ))}
                </svg>
              </div>

              {/* Mini P&L */}
              <div className="md:col-span-2 bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
                <p className="text-sm font-semibold text-gray-900 mb-4">3-Year P&amp;L</p>
                <div className="space-y-2 text-xs">
                  <div className="grid grid-cols-4 gap-2 text-gray-400 font-semibold">
                    <span></span><span className="text-right">Y1</span><span className="text-right">Y2</span><span className="text-right">Y3</span>
                  </div>
                  {[
                    { l: "Revenue", v: ["$420K", "$1.6M", "$4.2M"], bold: true },
                    { l: "COGS", v: ["($92K)", "($340K)", "($924K)"] },
                    { l: "Gross profit", v: ["$328K", "$1.26M", "$3.28M"], bold: true },
                    { l: "Opex", v: ["($580K)", "($1.1M)", "($1.9M)"] },
                    { l: "EBITDA", v: ["($252K)", "$160K", "$1.38M"], bold: true, accent: true },
                  ].map((r) => (
                    <div key={r.l} className={`grid grid-cols-4 gap-2 ${r.bold ? "font-bold text-gray-900" : "text-gray-500"} ${r.accent ? "text-emerald-600" : ""}`}>
                      <span>{r.l}</span>
                      {r.v.map((x, i) => <span key={i} className="text-right tabular-nums">{x}</span>)}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <p className="text-center text-xs text-gray-400 mt-6">
              This is a sample. Your model uses your own inputs and recalculates the full Excel engine.
            </p>
          </div>
        </div>
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
                iconBg: "bg-blue-100 text-blue-600",
                title: "Describe your idea",
                desc: "10 quick questions about your business model, market, pricing, and growth ambition.",
              },
              {
                step: "02",
                icon: <Zap className="w-6 h-6" />,
                iconBg: "bg-cyan-100 text-cyan-600",
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
                icon: <BarChart3 className="w-5 h-5 text-blue-600" />,
                bg: "bg-blue-50",
                title: "3 growth scenarios",
                desc: "Conservative, base, and aggressive projections so you are ready for any investor question.",
              },
              {
                icon: <TrendingUp className="w-5 h-5 text-cyan-600" />,
                bg: "bg-cyan-50",
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
            <div className="bg-gradient-to-br from-blue-600 to-cyan-700 rounded-2xl p-8 text-white shadow-xl shadow-blue-500/20">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-blue-100 text-xs uppercase tracking-widest font-bold">Pro</h3>
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
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-300" />
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
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-emerald-500 text-white px-8 py-4 rounded-xl text-base font-bold hover:from-blue-700 hover:to-emerald-600 transition-all shadow-lg shadow-blue-500/20"
            >
              Start building for free
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-8">
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-between flex-wrap gap-4">
          <span className="text-gray-300 text-xs font-mono">{VERSION_LABEL}</span>
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
