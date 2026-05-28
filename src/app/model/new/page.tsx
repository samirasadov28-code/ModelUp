import Image from "next/image";
import Link from "next/link";
import { QuestionnaireFlow } from "@/components/questionnaire/QuestionnaireFlow";
import { TrustBadge } from "@/components/outputs/TrustBadge";
import { NewModelHeader } from "@/components/NewModelHeader";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export const metadata = {
  title: "Build your AI financial model",
  description:
    "Describe your startup in a sentence — our AI infers your business model, pricing, churn, CAC, burn, and raise, then generates a 5-year P&L, cash flow, DCF + EBITDA-multiple valuation, and cap table in 30 seconds.",
  alternates: { canonical: "/model/new" },
};

export default function NewModelPage() {
  return (
    <main className="min-h-screen bg-white text-gray-900">
      <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/Logo_192.png" alt="ModelUp" width={28} height={28} className="rounded-lg" />
            <span className="text-gray-900 font-bold text-lg tracking-tight">
              Model<span className="text-blue-600">Up</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="hidden sm:block">
              <TrustBadge />
            </div>
            <LanguageSwitcher compact />
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 pt-12 pb-32">
        <NewModelHeader />
        <QuestionnaireFlow />
      </div>
    </main>
  );
}
