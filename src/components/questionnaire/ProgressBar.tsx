"use client";

import { Progress } from "@/components/ui/progress";

interface ProgressBarProps {
  current: number;
  total: number;
}

export function ProgressBar({ current, total }: ProgressBarProps) {
  const percent = Math.round((current / total) * 100);
  return (
    <div className="w-full space-y-1.5">
      <Progress value={percent} className="h-1" />
      <p className="text-right text-xs text-white/30">{percent}% complete</p>
    </div>
  );
}
