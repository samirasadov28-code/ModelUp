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
    default: "border-white/10 bg-white/3",
    highlight: "border-accent-500/30 bg-accent-500/8",
    success: "border-emerald-500/30 bg-emerald-500/5",
    warning: "border-amber-500/30 bg-amber-500/5",
  };

  const valueColors = {
    default: "text-white",
    highlight: "text-accent-400",
    success: "text-emerald-400",
    warning: "text-amber-400",
  };

  return (
    <div className={cn("rounded-xl border p-5", variants[variant], className)}>
      <p className="text-xs text-white/40 uppercase tracking-wider font-medium mb-2">{label}</p>
      <p className={cn("text-2xl font-bold font-mono tabular-nums", valueColors[variant])}>
        {value}
      </p>
      {sub && <p className="text-xs text-white/35 mt-1">{sub}</p>}
    </div>
  );
}
