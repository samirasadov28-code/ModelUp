"use client";

import { Sparkles } from "lucide-react";

interface FundingNarrativeProps {
  narrative: string;
}

export function FundingNarrative({ narrative }: FundingNarrativeProps) {
  return (
    <div className="rounded-xl border border-accent-500/20 bg-accent-500/5 p-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-48 h-48 bg-accent-500/5 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-4 h-4 text-accent-400" />
        <span className="text-xs font-semibold text-accent-400 uppercase tracking-wider">
          Funding Ask Narrative
        </span>
      </div>
      <p className="text-white/85 leading-relaxed text-sm">{narrative}</p>
      <p className="text-white/25 text-xs mt-4">
        Generated from your financial model outputs. Refine in your pitch deck.
      </p>
    </div>
  );
}
