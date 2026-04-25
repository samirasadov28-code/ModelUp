import { QuestionnaireFlow } from "@/components/questionnaire/QuestionnaireFlow";
import { TrustBadge } from "@/components/outputs/TrustBadge";

export const metadata = {
  title: "Build Your Model — ModelUp",
  description: "Answer 10 questions. Get a professional financial model.",
};

export default function NewModelPage() {
  return (
    <main className="min-h-screen bg-navy-900 text-white">
      {/* Header */}
      <div className="border-b border-white/8">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="/" className="text-white font-semibold text-lg tracking-tight">
            Model<span className="text-accent-500">Up</span>
          </a>
          <TrustBadge />
        </div>
      </div>

      {/* Main */}
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-white mb-3">
            Build your financial model
          </h1>
          <p className="text-white/50 max-w-md mx-auto">
            Answer a few questions about your business. We&apos;ll generate a professional-grade
            3-year financial model in seconds.
          </p>
        </div>

        <QuestionnaireFlow />
      </div>
    </main>
  );
}
