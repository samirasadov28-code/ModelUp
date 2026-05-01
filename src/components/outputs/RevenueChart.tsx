"use client";

import {
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  ReferenceLine,
} from "recharts";
import { useState } from "react";
import type { MonthlyDataPoint, AnnualSummary } from "@/lib/types";
import { formatCurrencyCompact } from "@/lib/utils";

const fmtAxis = formatCurrencyCompact;

const TOOLTIP_STYLE = {
  backgroundColor: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "8px",
  color: "#0f172a",
  fontSize: "12px",
  boxShadow: "0 10px 30px rgba(15,23,42,0.08)",
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
        <h3 className="text-sm font-semibold text-gray-900">Revenue & EBITDA</h3>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1 border border-gray-200">
          {(["annual", "monthly"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                view === v ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={240}>
        <ComposedChart data={view === "annual" ? annualData : monthlyData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="label" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={fmtAxis} tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            formatter={(val: number, name: string) => [fmtAxis(val), name]}
          />
          <Legend wrapperStyle={{ fontSize: "12px", color: "#475569" }} />
          <Bar dataKey="revenue" name="Revenue" fill="#2563eb" radius={[3, 3, 0, 0]} />
          {view === "annual" && (
            <Bar dataKey="grossProfit" name="Gross Profit" fill="#10b981" radius={[3, 3, 0, 0]} />
          )}
          <Line
            type="monotone"
            dataKey="ebitda"
            name="EBITDA"
            stroke="#f59e0b"
            strokeWidth={2}
            dot={false}
          />
          <ReferenceLine y={0} stroke="#cbd5e1" strokeDasharray="4 4" />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
