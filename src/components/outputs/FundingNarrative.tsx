"use client";

import { Sparkles } from "lucide-react";

interface FundingNarrativeProps {
  narrative: string;
}

export function FundingNarrative({ narrative }: FundingNarrativeProps) {
  return (
    <div className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-48 h-48 bg-blue-200/30 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="flex items-center gap-2 mb-4 relative">
        <Sparkles className="w-4 h-4 text-blue-600" />
        <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">
          Funding Ask Narrative
        </span>
      </div>
      <p className="text-gray-800 leading-relaxed text-sm relative">{narrative}</p>
      <p className="text-gray-400 text-xs mt-4 relative">
        Generated from your financial model outputs. Refine in your pitch deck.
      </p>
    </div>
  );
}
