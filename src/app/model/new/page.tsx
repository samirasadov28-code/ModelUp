import Image from "next/image";
import Link from "next/link";
import { QuestionnaireFlow } from "@/components/questionnaire/QuestionnaireFlow";
import { TrustBadge } from "@/components/outputs/TrustBadge";

export const metadata = {
  title: "Build Your Model — ModelUp",
  description: "Answer 10 questions. Get a professional financial model.",
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
          <TrustBadge />
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-3 tracking-tight">
            Build your financial model
          </h1>
          <p className="text-gray-500 max-w-md mx-auto">
            Answer a few questions about your business. We&apos;ll generate a professional-grade
            5-year financial model in seconds.
          </p>
        </div>

        <QuestionnaireFlow />
      </div>
    </main>
  );
}
