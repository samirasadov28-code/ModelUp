"use client";

import { cn } from "@/lib/utils";

interface MetricCardProps {
  label: string;
  value: string;
  sub?: string;
  variant?: "default" | "highlight" | "success" | "warning";
  className?: string;
}

export function MetricCard({ label, value, sub, variant = "default", className }: MetricCardProps) {
  const variants = {
    default: "border-gray-200 bg-white",
    highlight: "border-blue-200 bg-blue-50/60",
    success: "border-emerald-200 bg-emerald-50/60",
    warning: "border-amber-200 bg-amber-50/60",
  };

  const valueColors = {
    default: "text-gray-900",
    highlight: "text-blue-700",
    success: "text-emerald-700",
    warning: "text-amber-700",
  };

  return (
    <div className={cn("rounded-xl border p-5 shadow-sm", variants[variant], className)}>
      <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-2">{label}</p>
      <p className={cn("text-2xl font-bold font-mono tabular-nums", valueColors[variant])}>
        {value}
      </p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}
