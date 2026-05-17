"use client";

import { cn, formatCurrencyCompact } from "@/lib/utils";
import type { UnitEconomics, Currency } from "@/lib/types";
import { useT } from "@/i18n/LocaleProvider";

interface MetricCardProps {
  label: string;
  value: string;
  sub?: string;
  status?: "green" | "amber" | "red" | "neutral";
  blurred?: boolean;
  proLabel?: string;
}

function MetricCard({ label, value, sub, status = "neutral", blurred = false, proLabel = "Pro only" }: MetricCardProps) {
  const statusStyles = {
    green: "border-emerald-200 bg-emerald-50/60",
    amber: "border-amber-200 bg-amber-50/60",
    red: "border-red-200 bg-red-50/60",
    neutral: "border-gray-200 bg-white",
  };

  const textStyles = {
    green: "text-emerald-700",
    amber: "text-amber-700",
    red: "text-red-700",
    neutral: "text-gray-900",
  };

  const dotStyles = {
    green: "bg-emerald-500",
    amber: "bg-amber-500",
    red: "bg-red-500",
    neutral: "bg-transparent",
  };

  return (
    <div className={cn("rounded-xl border p-5 relative overflow-hidden shadow-sm", statusStyles[status])}>
      <p className="text-xs text-gray-500 uppercase tracking-wider mb-3 font-semibold">{label}</p>
      <p
        className={cn(
          "text-2xl font-bold font-mono tabular-nums",
          textStyles[status],
          blurred && "blur-sm select-none"
        )}
      >
        {value}
      </p>
      {sub && (
        <p className={cn("text-xs text-gray-500 mt-1", blurred && "blur-sm")}>{sub}</p>
      )}
      {status !== "neutral" && (
        <div className={cn("absolute top-4 right-4 w-2 h-2 rounded-full", dotStyles[status])} />
      )}
      {blurred && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs text-blue-700 font-semibold bg-white/95 px-3 py-1.5 rounded-full border border-blue-200 shadow-sm">
            {proLabel}
          </span>
        </div>
      )}
    </div>
  );
}

interface UnitEconomicsDashboardProps {
  ue: UnitEconomics;
  blurValues?: boolean;
  currency?: Currency;
}

export function UnitEconomicsDashboard({ ue, blurValues = false, currency }: UnitEconomicsDashboardProps) {
  const { t } = useT();
  const fmt = (v: number) => formatCurrencyCompact(v, currency);
  const ltvLabel =
    ue.ltvCacRatio >= 3 ? t("ue.ltv_cac_healthy") :
    ue.ltvCacRatio >= 1 ? t("ue.ltv_cac_acceptable") :
    t("ue.ltv_cac_needs_work");
  const proOnly = t("ue.pro_only");

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <MetricCard
          label={t("ue.cac_label")}
          value={fmt(ue.cac)}
          sub={t("ue.cac_sub")}
          blurred={blurValues}
          proLabel={proOnly}
        />
        <MetricCard
          label={t("ue.ltv_label")}
          value={fmt(ue.ltv)}
          sub={t("ue.ltv_sub", { gm: (ue.grossMarginRate * 100).toFixed(0) })}
          blurred={blurValues}
          proLabel={proOnly}
        />
        <MetricCard
          label={t("ue.ltv_cac_label")}
          value={`${ue.ltvCacRatio.toFixed(1)}x`}
          sub={blurValues ? undefined : ltvLabel}
          status={blurValues ? "neutral" : ue.cacStatus}
          blurred={blurValues}
          proLabel={proOnly}
        />
        <MetricCard
          label={t("ue.payback_label")}
          value={t("ue.payback_value", { months: String(Math.round(ue.paybackMonths)) })}
          sub={t("ue.payback_sub")}
          blurred={blurValues}
          proLabel={proOnly}
        />
      </div>

      {!blurValues && (
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-2">{t("ue.blended_arpu")}</p>
          <p className="text-xl font-bold text-gray-900 font-mono">{fmt(ue.blendedArpu)}<span className="text-sm text-gray-400 font-normal ml-1">{t("ue.blended_arpu_per_month")}</span></p>
          <p className="text-xs text-gray-500 mt-1">{t("ue.blended_arpu_sub")}</p>
        </div>
      )}
    </div>
  );
}
