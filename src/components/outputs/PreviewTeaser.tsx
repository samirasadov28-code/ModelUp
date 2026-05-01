"use client";

import { Lock } from "lucide-react";
import type { ReactNode } from "react";

interface PreviewTeaserProps {
  label: string;
  children: ReactNode;
}

export function PreviewTeaser({ label, children }: PreviewTeaserProps) {
  return (
    <div className="relative rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
      <div className="pointer-events-none select-none blur-[3px] opacity-70">
        {children}
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-white/60 to-white/85" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="inline-flex items-center gap-2 bg-blue-600 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-md shadow-blue-500/30">
          <Lock className="w-3.5 h-3.5" />
          {label} — unlock with Pro
        </div>
      </div>
    </div>
  );
}

export function ExampleRevenueChart() {
  return (
    <div className="p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-semibold text-gray-900">Revenue forecast</p>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500" />Revenue</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" />EBITDA</span>
        </div>
      </div>
      <svg viewBox="0 0 320 160" className="w-full h-40">
        {[0, 1, 2, 3].map((i) => (
          <line key={i} x1="0" x2="320" y1={20 + i * 35} y2={20 + i * 35} stroke="#f1f5f9" strokeWidth="1" />
        ))}
        {[
          { x: 30, h: 30, lh: 12 },
          { x: 80, h: 55, lh: 22 },
          { x: 130, h: 78, lh: 38 },
          { x: 180, h: 95, lh: 55 },
          { x: 230, h: 110, lh: 70 },
          { x: 280, h: 125, lh: 85 },
        ].map((b, i) => (
          <g key={i}>
            <rect x={b.x - 14} y={150 - b.h} width="12" height={b.h} rx="2" fill="#2563eb" />
            <rect x={b.x} y={150 - b.lh} width="12" height={b.lh} rx="2" fill="#10b981" />
          </g>
        ))}
      </svg>
    </div>
  );
}

export function ExampleCapTable() {
  const rows = [
    { name: "Founder", pre: "75%", post: "55%" },
    { name: "Team & ESOP", pre: "20%", post: "16%" },
    { name: "Existing investors", pre: "5%", post: "4%" },
    { name: "New investors", pre: "—", post: "25%" },
  ];
  return (
    <div className="p-5">
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="rounded-lg border border-gray-200 bg-white p-3 text-center">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-1">Pre-money</p>
          <p className="text-base font-bold text-gray-900">$6.0M</p>
        </div>
        <div className="rounded-lg border border-blue-200 bg-blue-50/60 p-3 text-center">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-1">Raise</p>
          <p className="text-base font-bold text-blue-700">$2.0M</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-3 text-center">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-1">Post-money</p>
          <p className="text-base font-bold text-gray-900">$8.0M</p>
        </div>
      </div>
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            <th className="text-left py-2 px-3 text-gray-500 font-semibold">Shareholder</th>
            <th className="text-right py-2 px-3 text-gray-500 font-semibold">Pre</th>
            <th className="text-right py-2 px-3 text-gray-500 font-semibold">Post</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.name} className="border-b border-gray-100">
              <td className="py-2 px-3 text-gray-800">{r.name}</td>
              <td className="py-2 px-3 text-right font-mono text-gray-600">{r.pre}</td>
              <td className="py-2 px-3 text-right font-mono text-gray-900 font-semibold">{r.post}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
