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
        "focus:outline-none focus:ring-2 focus:ring-blue-500/40",
        selected
          ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500"
          : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/60"
      )}
    >
      <div className="flex items-center gap-3">
        {icon && <span className="text-xl">{icon}</span>}
        <div>
          <p className={cn("font-semibold text-sm", selected ? "text-gray-900" : "text-gray-800")}>
            {label}
          </p>
          {description && (
            <p className="text-xs text-gray-500 mt-0.5">{description}</p>
          )}
        </div>
        <div className="ml-auto">
          <div
            className={cn(
              "w-4 h-4 rounded-full border-2 flex items-center justify-center",
              selected ? "border-blue-600 bg-blue-600" : "border-gray-300"
            )}
          >
            {selected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
          </div>
        </div>
      </div>
    </button>
  );
}
