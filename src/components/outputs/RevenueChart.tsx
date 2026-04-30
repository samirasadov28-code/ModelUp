"use client";

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Area,
  ReferenceLine,
} from "recharts";
import { useState } from "react";
import type { MonthlyDataPoint, AnnualSummary } from "@/lib/types";
import { formatCurrencyCompact } from "@/lib/utils";

const fmtAxis = formatCurrencyCompact;

const TOOLTIP_STYLE = {
  backgroundColor: "#0f2040",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "8px",
  color: "#fff",
  fontSize: "12px",
};

interface RevenueChartProps {
  monthly: MonthlyDataPoint[];
  annual: AnnualSummary[];
}

export function RevenueChart({ monthly, annual }: RevenueChartProps) {
  const [view, setView] = useState<"annual" | "monthly">("annual");

  const annualData = annual.map((yr) => ({
    label: yr.label,
    revenue: Math.round(yr.revenue),
    grossProfit: Math.round(yr.grossProfit),
    ebitda: Math.round(yr.ebitda),
  }));

  const monthlyData = monthly.map((m) => ({
    label: m.label,
    revenue: Math.round(m.revenue),
    ebitda: Math.round(m.ebitda),
  }));

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-white/60">Revenue & EBITDA</h3>
        <div className="flex gap-1 bg-navy-900/60 rounded-lg p-1 border border-white/10">
          {(["annual", "monthly"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                view === v ? "bg-navy-800 text-white" : "text-white/40 hover:text-white/70"
              }`}
            >
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={240}>
        <ComposedChart data={view === "annual" ? annualData : monthlyData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis dataKey="label" tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={fmtAxis} tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            formatter={(val: number, name: string) => [fmtAxis(val), name]}
          />
          <Legend
            wrapperStyle={{ fontSize: "12px", color: "rgba(255,255,255,0.5)" }}
          />
          <Bar dataKey="revenue" name="Revenue" fill="#3B82F6" opacity={0.85} radius={[3, 3, 0, 0]} />
          {view === "annual" && (
            <Bar dataKey="grossProfit" name="Gross Profit" fill="#10B981" opacity={0.7} radius={[3, 3, 0, 0]} />
          )}
          <Line
            type="monotone"
            dataKey="ebitda"
            name="EBITDA"
            stroke="#F59E0B"
            strokeWidth={2}
            dot={false}
          />
          <ReferenceLine y={0} stroke="rgba(255,255,255,0.15)" strokeDasharray="4 4" />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
