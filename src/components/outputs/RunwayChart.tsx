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
import type { MonthlyDataPoint, RunwayData, Currency } from "@/lib/types";
import { formatCurrencyCompact } from "@/lib/utils";

const TOOLTIP_STYLE = {
  backgroundColor: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "8px",
  color: "#0f172a",
  fontSize: "12px",
  boxShadow: "0 10px 30px rgba(15,23,42,0.08)",
};

interface RunwayChartProps {
  monthly: MonthlyDataPoint[];
  runway: RunwayData;
  currency?: Currency;
}

export function RunwayChart({ monthly, runway, currency }: RunwayChartProps) {
  const fmtAxis = (v: number) => formatCurrencyCompact(v, currency);
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
        <h3 className="text-sm font-semibold text-gray-900">Cash Position</h3>
        {runway.breakEvenMonth && (
          <span className="text-xs bg-emerald-100 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full font-semibold">
            EBITDA+ at month {runway.breakEvenMonth}
          </span>
        )}
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="cashGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2563eb" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#2563eb" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="label" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} interval={5} />
          <YAxis tickFormatter={fmtAxis} tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            formatter={(val: number, name: string) => [fmtAxis(val), name === "cash" ? "Closing Cash" : name]}
          />
          <ReferenceLine y={0} stroke="rgba(239,68,68,0.6)" strokeDasharray="4 4" />
          {breakEvenLabel && (
            <ReferenceLine
              x={breakEvenLabel}
              stroke="rgba(16,185,129,0.7)"
              strokeDasharray="4 4"
              label={{ value: "EBITDA+", fill: "#059669", fontSize: 10 }}
            />
          )}
          <Area
            type="monotone"
            dataKey="cash"
            stroke="#2563eb"
            strokeWidth={2}
            fill="url(#cashGrad)"
            name="cash"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
