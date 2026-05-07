"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Lock, Sparkles } from "lucide-react";
import Link from "next/link";
import { MoneyInput } from "@/components/ui/money-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { hasEarlyAccess } from "@/lib/early-access";
import { cn } from "@/lib/utils";
import type { RevenueStream, RevenueStreamType } from "@/lib/types";

const STREAM_TYPES: { value: RevenueStreamType; label: string; example: string; icon: string }[] = [
  { value: "transaction", label: "Transaction / take rate", example: "Marketplace fees, % of GMV", icon: "💱" },
  { value: "service", label: "Services / consulting", example: "Implementation, retainers", icon: "🤝" },
  { value: "one-time", label: "One-time / hardware", example: "Setup fees, devices, licenses", icon: "📦" },
  { value: "usage", label: "Usage-based", example: "Per API call, per event", icon: "📊" },
  { value: "ads", label: "Ads / sponsorships", example: "Ad inventory, brand deals", icon: "📢" },
  { value: "other", label: "Other", example: "Anything else", icon: "✨" },
];

interface RevenueStreamsEditorProps {
  value: RevenueStream[];
  onChange: (next: RevenueStream[]) => void;
}

function newId(): string {
  return Math.random().toString(36).slice(2, 10);
}

function defaultStream(): RevenueStream {
  return {
    id: newId(),
    type: "transaction",
    name: "",
    monthlyRevenue: 0,
    scalesWithUsers: true,
  };
}

export function RevenueStreamsEditor({ value, onChange }: RevenueStreamsEditorProps) {
  const [isPro, setIsPro] = useState(false);

  useEffect(() => {
    setIsPro(hasEarlyAccess());
  }, []);

  function update(idx: number, patch: Partial<RevenueStream>) {
    onChange(value.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  }

  function add() {
    onChange([...value, defaultStream()]);
  }

  function remove(idx: number) {
    onChange(value.filter((_, i) => i !== idx));
  }

  if (!isPro) {
    return (
      <div className="relative rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50/60 via-white to-cyan-50/60 p-6 overflow-hidden">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-blue-700 mb-1">Pro feature</p>
            <h4 className="text-base font-bold text-gray-900">Mix multiple revenue streams</h4>
            <p className="text-sm text-gray-600 mt-1">
              Most real businesses earn from more than one place. With Pro you can layer transaction
              fees, services, one-time sales, usage-based charges, ad revenue and more on top of your
              subscription tiers — and the model recomputes the full P&amp;L automatically.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-5 select-none">
          {STREAM_TYPES.map((t) => (
            <div
              key={t.value}
              className="rounded-lg border border-gray-200 bg-white/80 px-3 py-2 text-xs text-gray-700"
            >
              <div className="flex items-center gap-1.5">
                <span>{t.icon}</span>
                <span className="font-semibold">{t.label}</span>
              </div>
              <p className="text-[11px] text-gray-500 mt-0.5">{t.example}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <Link
            href="/pricing"
            className="inline-flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg shadow-sm shadow-blue-500/20 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Get Pro — $4.99/mo
          </Link>
          <p className="text-xs text-gray-500 self-center">
            Already have an early-access invite? Enter your email on the{" "}
            <Link href="/pricing" className="text-blue-700 underline underline-offset-2">
              pricing page
            </Link>
            .
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-900">Other revenue streams</p>
          <p className="text-xs text-gray-500">
            Layer additional streams on top of your subscription tiers. They&apos;ll be added to
            monthly revenue in the model.
          </p>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-100 px-2 py-1 rounded-full">
          Pro
        </span>
      </div>

      {value.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white px-4 py-6 text-center text-sm text-gray-500">
          No additional streams yet — add one to mix in transaction fees, services, ads and more.
        </div>
      )}

      {value.map((stream, i) => {
        const meta = STREAM_TYPES.find((t) => t.value === stream.type) ?? STREAM_TYPES[0];
        return (
          <div key={stream.id} className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
                Stream {i + 1}
              </p>
              <button
                type="button"
                onClick={() => remove(i)}
                className="text-gray-400 hover:text-red-600 transition-colors"
                aria-label={`Remove stream ${i + 1}`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div>
              <Label className="text-xs text-gray-600 mb-1 block font-medium">Type</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {STREAM_TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => update(i, { type: t.value })}
                    className={cn(
                      "rounded-lg border px-3 py-2 text-xs text-left transition-all",
                      stream.type === t.value
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                    )}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{t.icon}</span>
                      <span className="font-semibold">{t.label}</span>
                    </div>
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-gray-500 mt-1.5">{meta.example}</p>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-gray-600 mb-1 block font-medium">Name</Label>
                <Input
                  placeholder="e.g. Marketplace fees"
                  value={stream.name}
                  onChange={(e) => update(i, { name: e.target.value })}
                  className="h-10 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs text-gray-600 mb-1 block font-medium">Starting $/month</Label>
                <MoneyInput
                  placeholder="5,000"
                  value={stream.monthlyRevenue || undefined}
                  onValueChange={(v) => update(i, { monthlyRevenue: v ?? 0 })}
                  className="h-10 text-sm"
                />
              </div>
            </div>

            <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={stream.scalesWithUsers}
                onChange={(e) => update(i, { scalesWithUsers: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              Scales with the customer base (uncheck for a flat monthly amount)
            </label>
          </div>
        );
      })}

      <button
        type="button"
        onClick={add}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-100 px-3 py-2 rounded-lg transition-colors"
      >
        <Plus className="w-4 h-4" />
        Add revenue stream
      </button>
    </div>
  );
}
