"use client";

import { cn } from "@/lib/utils";

interface OptionCardProps {
  label: string;
  description?: string;
  icon?: React.ReactNode;
  selected: boolean;
  onClick: () => void;
}

export function OptionCard({ label, description, icon, selected, onClick }: OptionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full text-left rounded-xl border px-5 py-4 transition-all duration-150",
        "focus:outline-none focus:ring-2 focus:ring-accent-500",
        selected
          ? "border-accent-500 bg-accent-500/10 ring-1 ring-accent-500"
          : "border-white/15 bg-navy-800/40 hover:border-white/30 hover:bg-navy-800/70"
      )}
    >
      <div className="flex items-center gap-3">
        {icon && <span className="text-xl">{icon}</span>}
        <div>
          <p className={cn("font-medium text-sm", selected ? "text-white" : "text-white/80")}>
            {label}
          </p>
          {description && (
            <p className="text-xs text-white/40 mt-0.5">{description}</p>
          )}
        </div>
        <div className="ml-auto">
          <div
            className={cn(
              "w-4 h-4 rounded-full border-2 flex items-center justify-center",
              selected ? "border-accent-500 bg-accent-500" : "border-white/30"
            )}
          >
            {selected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
          </div>
        </div>
      </div>
    </button>
  );
}
