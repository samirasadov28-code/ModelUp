"use client";

import Link from "next/link";
import { Eye, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface ViewModeToggleProps {
  modelId: string;
  current: "free" | "pro";
}

/**
 * Segmented toggle that lets Pro users hop between the Free preview and the
 * full Pro view of the same model. Rendered in the nav bar of both pages so
 * the active page is highlighted and the other is one click away.
 */
export function ViewModeToggle({ modelId, current }: ViewModeToggleProps) {
  const baseTab =
    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap";
  return (
    <div className="inline-flex items-center gap-1 bg-gray-100 border border-gray-200 rounded-lg p-0.5">
      <Link
        href={`/model/${modelId}/preview`}
        aria-current={current === "free" ? "page" : undefined}
        title="See what a free user would see for this model"
        className={cn(
          baseTab,
          current === "free"
            ? "bg-white text-gray-900 shadow-sm"
            : "text-gray-500 hover:text-gray-900"
        )}
      >
        <Eye className="w-3.5 h-3.5" />
        Free
      </Link>
      <Link
        href={`/model/${modelId}/full`}
        aria-current={current === "pro" ? "page" : undefined}
        title="Open the full Pro model"
        className={cn(
          baseTab,
          current === "pro"
            ? "bg-blue-600 text-white shadow-sm"
            : "text-blue-700 hover:text-blue-900"
        )}
      >
        <Sparkles className="w-3.5 h-3.5" />
        Pro
      </Link>
    </div>
  );
}
