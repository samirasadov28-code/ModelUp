"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import type { MonthlyDataPoint, RunwayData } from "@/lib/types";

function fmtAxis(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value}`;
}

const TOOLTIP_STYLE = {
  backgroundColor: "#0f2040",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "8px",
  color: "#fff",
  fontSize: "12px",
};

interface RunwayChartProps {
  monthly: MonthlyDataPoint[];
  runway: RunwayData;
}

export function RunwayChart({ monthly, runway }: RunwayChartProps) {
  const data = monthly.map((m) => ({
    label: m.label,
    cash: Math.round(m.closingCash),
    revenue: Math.round(m.revenue),
    burn: Math.round(m.opex),
  }));

  const breakEvenIdx = runway.breakEvenMonth ? runway.breakEvenMonth - 1 : null;
  const breakEvenLabel = breakEvenIdx != null ? monthly[breakEvenIdx]?.label : null;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-white/60">Cash Position</h3>
        {runway.breakEvenMonth && (
          <span className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-full">
            EBITDA+ at month {runway.breakEvenMonth}
          </span>
        )}
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="cashGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis dataKey="label" tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 11 }} axisLine={false} tickLine={false} interval={5} />
          <YAxis tickFormatter={fmtAxis} tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            formatter={(val: number, name: string) => [fmtAxis(val), name === "cash" ? "Closing Cash" : name]}
          />
          <ReferenceLine y={0} stroke="rgba(239,68,68,0.4)" strokeDasharray="4 4" />
          {breakEvenLabel && (
            <ReferenceLine
              x={breakEvenLabel}
              stroke="rgba(16,185,129,0.5)"
              strokeDasharray="4 4"
              label={{ value: "EBITDA+", fill: "rgba(16,185,129,0.7)", fontSize: 10 }}
            />
          )}
          <Area
            type="monotone"
            dataKey="cash"
            stroke="#3B82F6"
            strokeWidth={2}
            fill="url(#cashGrad)"
            name="cash"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
