"use client";

import { useMemo, useState } from "react";
import { Plus, RotateCcw, Trash2 } from "lucide-react";
import { formatCurrency, formatCurrencyCompact, formatPercent } from "@/lib/utils";
import type { ModelOutputs } from "@/lib/types";

interface ProCapTableWaterfallProps {
  model: ModelOutputs;
}

interface PreSeedHolder {
  id: string;
  name: string;
  percent: number; // 0..100
}

interface FutureRound {
  id: string;
  name: string;        // "Series A", "Series B", "Series B extension"
  raise: number;
  preMoneyValuation: number;
  esopRefresh: number; // % top-up of ESOP (pre-money, dilutes existing holders before raise)
}

const newId = () => Math.random().toString(36).slice(2, 9);

function defaultRoundsFor(model: ModelOutputs): FutureRound[] {
  // Suggest a sensible Series A + B based on the seed valuation we already
  // computed. Each round projects ~3-4× pre-money on a 2-year horizon.
  const seedPost = model.capTable.postMoneyValuation;
  return [
    {
      id: newId(),
      name: "Series A",
      raise: Math.round(model.capTable.raiseAmount * 6),
      preMoneyValuation: Math.round(seedPost * 3.5),
      esopRefresh: 0.05,
    },
    {
      id: newId(),
      name: "Series B",
      raise: Math.round(model.capTable.raiseAmount * 15),
      preMoneyValuation: Math.round(seedPost * 10),
      esopRefresh: 0.03,
    },
  ];
}

export function ProCapTableWaterfall({ model }: ProCapTableWaterfallProps) {
  const currency = model.currency;
  const fmt = (v: number) => formatCurrencyCompact(v, currency);
  const fmtFull = (v: number) => formatCurrency(v, 0, currency);

  // Pre-seed ownership ─────────────────────────────────────────────────────
  const initialHolders: PreSeedHolder[] = useMemo(
    () => [
      { id: newId(), name: "Founder 1", percent: 50 },
      { id: newId(), name: "Founder 2", percent: 35 },
      { id: newId(), name: "Pre-seed angels", percent: 5 },
      { id: newId(), name: "ESOP", percent: 10 },
    ],
    []
  );
  const [holders, setHolders] = useState<PreSeedHolder[]>(initialHolders);
  const [futureRounds, setFutureRounds] = useState<FutureRound[]>(() => defaultRoundsFor(model));
  const initialRoundsSnapshot = useMemo(() => defaultRoundsFor(model), [model]);

  function reset() {
    setHolders(initialHolders);
    setFutureRounds(initialRoundsSnapshot);
  }

  const preSeedTotal = holders.reduce((s, h) => s + (h.percent || 0), 0);

  function updateHolder(id: string, patch: Partial<PreSeedHolder>) {
    setHolders((prev) => prev.map((h) => (h.id === id ? { ...h, ...patch } : h)));
  }
  function addHolder() {
    setHolders((prev) => [...prev, { id: newId(), name: "New holder", percent: 0 }]);
  }
  function removeHolder(id: string) {
    setHolders((prev) => prev.filter((h) => h.id !== id));
  }

  function updateRound(id: string, patch: Partial<FutureRound>) {
    setFutureRounds((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }
  function addRound() {
    setFutureRounds((prev) => [
      ...prev,
      {
        id: newId(),
        name: `Round ${prev.length + 1}`,
        raise: 0,
        preMoneyValuation: 0,
        esopRefresh: 0.05,
      },
    ]);
  }
  function removeRound(id: string) {
    setFutureRounds((prev) => prev.filter((r) => r.id !== id));
  }

  /**
   * Run the waterfall:
   *  • Start at pre-seed ownership (sums to 100%)
   *  • Apply this round (engine's capTable.newEquityPercent already known) —
   *    new investors get newEquity %, existing holders dilute pro-rata
   *  • For each future round: ESOP refresh dilutes everyone pre-money, then
   *    new investors get raise / post-money equity
   */
  const waterfall = useMemo(() => {
    // Normalise pre-seed to 100%
    const total = preSeedTotal > 0 ? preSeedTotal : 1;
    let ownership: Record<string, number> = {};
    holders.forEach((h) => {
      ownership[h.name] = (h.percent / total);
    });

    const stages: {
      label: string;
      preMoneyValuation: number;
      raise: number;
      postMoneyValuation: number;
      newEquityPercent: number;
      esopRefresh: number;
      ownership: { name: string; percent: number }[];
    }[] = [];

    // Stage 0 — Pre-seed (just the starting splits)
    stages.push({
      label: "Pre-seed (today)",
      preMoneyValuation: 0,
      raise: 0,
      postMoneyValuation: 0,
      newEquityPercent: 0,
      esopRefresh: 0,
      ownership: Object.entries(ownership).map(([name, pct]) => ({ name, percent: pct })),
    });

    // Stage 1 — This round (the seed/A we're modeling now)
    const thisRound = model.capTable;
    const thisNewEquity = thisRound.newEquityPercent;
    // Dilute existing holders pro-rata, add new investors
    const afterThisRound: Record<string, number> = {};
    Object.entries(ownership).forEach(([name, pct]) => {
      afterThisRound[name] = pct * (1 - thisNewEquity);
    });
    afterThisRound["This round investors"] = thisNewEquity;
    ownership = afterThisRound;

    stages.push({
      label: `This round (${model.answers.fundingStage.replace("-", " ")})`,
      preMoneyValuation: thisRound.preMoneyValuation,
      raise: thisRound.raiseAmount,
      postMoneyValuation: thisRound.postMoneyValuation,
      newEquityPercent: thisNewEquity,
      esopRefresh: 0,
      ownership: Object.entries(ownership).map(([name, pct]) => ({ name, percent: pct })),
    });

    // Stage 2+ — Future rounds
    futureRounds.forEach((r) => {
      // ESOP refresh dilutes everyone pre-money. The ESOP entry (existing or
      // new) grows by the refresh percentage.
      if (r.esopRefresh > 0) {
        const refresh = r.esopRefresh;
        const diluted: Record<string, number> = {};
        Object.entries(ownership).forEach(([name, pct]) => {
          diluted[name] = pct * (1 - refresh);
        });
        diluted["ESOP"] = (diluted["ESOP"] ?? 0) + refresh;
        ownership = diluted;
      }
      // New round equity
      const postMoney = r.preMoneyValuation + r.raise;
      const newEquity = postMoney > 0 ? r.raise / postMoney : 0;
      const afterRound: Record<string, number> = {};
      Object.entries(ownership).forEach(([name, pct]) => {
        afterRound[name] = pct * (1 - newEquity);
      });
      afterRound[`${r.name} investors`] = newEquity;
      ownership = afterRound;

      stages.push({
        label: r.name,
        preMoneyValuation: r.preMoneyValuation,
        raise: r.raise,
        postMoneyValuation: postMoney,
        newEquityPercent: newEquity,
        esopRefresh: r.esopRefresh,
        ownership: Object.entries(ownership).map(([name, pct]) => ({ name, percent: pct })),
      });
    });

    // Build the complete list of shareholder names across stages so we render
    // a consistent table. Use a plain object since the project's TS target
    // doesn't iterate Set directly.
    const seen: Record<string, true> = {};
    const allNames: string[] = [];
    stages.forEach((s) =>
      s.ownership.forEach((o) => {
        if (!seen[o.name]) {
          seen[o.name] = true;
          allNames.push(o.name);
        }
      })
    );

    return { stages, allNames };
  }, [holders, futureRounds, model, preSeedTotal]);

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-5 flex items-start gap-3">
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-900">
            Pre-seed ownership + projected future rounds
          </p>
          <p className="text-xs text-gray-600 mt-0.5">
            Edit the pre-seed cap table on the left and the projected rounds on the right. The
            waterfall below shows founder dilution at each stage, including ESOP refreshes.
          </p>
        </div>
        <button
          type="button"
          onClick={reset}
          className="shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-lg transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Pre-seed holders */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Pre-seed cap table (before this round)
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Total: {preSeedTotal.toFixed(1)}%{" "}
                {Math.abs(preSeedTotal - 100) > 0.5 && (
                  <span className="text-amber-600 font-medium">(should be 100%)</span>
                )}
              </p>
            </div>
            <button
              type="button"
              onClick={addHolder}
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-800"
            >
              <Plus className="w-3 h-3" />
              Add
            </button>
          </div>
          <div className="space-y-2">
            {holders.map((h) => (
              <div key={h.id} className="flex items-center gap-2">
                <input
                  type="text"
                  value={h.name}
                  onChange={(e) => updateHolder(h.id, { name: e.target.value })}
                  className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400"
                />
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={0.5}
                  value={h.percent}
                  onChange={(e) => updateHolder(h.id, { percent: Number(e.target.value) })}
                  className="w-20 rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm text-right tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400"
                />
                <span className="text-xs text-gray-500 w-3">%</span>
                <button
                  type="button"
                  onClick={() => removeHolder(h.id)}
                  className="text-gray-400 hover:text-rose-600 transition-colors"
                  title="Remove"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Future rounds */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Projected future rounds
            </p>
            <button
              type="button"
              onClick={addRound}
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-800"
            >
              <Plus className="w-3 h-3" />
              Add round
            </button>
          </div>
          <div className="space-y-3">
            {futureRounds.map((r) => (
              <div key={r.id} className="rounded-lg border border-gray-200 bg-gray-50/60 p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={r.name}
                    onChange={(e) => updateRound(r.id, { name: e.target.value })}
                    className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400"
                  />
                  <button
                    type="button"
                    onClick={() => removeRound(r.id)}
                    className="text-gray-400 hover:text-rose-600 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] uppercase tracking-wider font-semibold text-gray-500">
                      Raise
                    </label>
                    <input
                      type="number"
                      value={r.raise}
                      onChange={(e) => updateRound(r.id, { raise: Number(e.target.value) })}
                      className="w-full mt-1 rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm text-right tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider font-semibold text-gray-500">
                      Pre-money
                    </label>
                    <input
                      type="number"
                      value={r.preMoneyValuation}
                      onChange={(e) =>
                        updateRound(r.id, { preMoneyValuation: Number(e.target.value) })
                      }
                      className="w-full mt-1 rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm text-right tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider font-semibold text-gray-500">
                      ESOP top-up %
                    </label>
                    <input
                      type="number"
                      step={0.5}
                      min={0}
                      max={30}
                      value={Math.round(r.esopRefresh * 1000) / 10}
                      onChange={(e) =>
                        updateRound(r.id, { esopRefresh: Number(e.target.value) / 100 })
                      }
                      className="w-full mt-1 rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm text-right tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-gray-400">
                  Post-money: {fmt(r.preMoneyValuation + r.raise)} · New investor equity:{" "}
                  {formatPercent(
                    r.preMoneyValuation + r.raise > 0 ? r.raise / (r.preMoneyValuation + r.raise) : 0,
                    1
                  )}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Waterfall table */}
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
          Dilution waterfall — ownership at each stage
        </p>
        <div className="rounded-xl border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-2 text-gray-500 font-semibold">Stage</th>
                <th className="text-right px-4 py-2 text-gray-500 font-semibold">Pre-money</th>
                <th className="text-right px-4 py-2 text-gray-500 font-semibold">Raise</th>
                <th className="text-right px-4 py-2 text-gray-500 font-semibold">Post-money</th>
                <th className="text-right px-4 py-2 text-gray-500 font-semibold">New equity</th>
                {waterfall.allNames.map((n) => (
                  <th
                    key={n}
                    className="text-right px-4 py-2 text-gray-500 font-semibold whitespace-nowrap"
                  >
                    {n}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {waterfall.stages.map((s, i) => (
                <tr key={i} className="border-b border-gray-100 hover:bg-gray-50/60">
                  <td className="px-4 py-2 font-semibold text-gray-900">{s.label}</td>
                  <td className="px-4 py-2 text-right font-mono tabular-nums text-gray-700">
                    {s.preMoneyValuation > 0 ? fmtFull(s.preMoneyValuation) : "—"}
                  </td>
                  <td className="px-4 py-2 text-right font-mono tabular-nums text-gray-700">
                    {s.raise > 0 ? fmtFull(s.raise) : "—"}
                  </td>
                  <td className="px-4 py-2 text-right font-mono tabular-nums text-gray-700">
                    {s.postMoneyValuation > 0 ? fmtFull(s.postMoneyValuation) : "—"}
                  </td>
                  <td className="px-4 py-2 text-right font-mono tabular-nums text-blue-700">
                    {s.newEquityPercent > 0 ? formatPercent(s.newEquityPercent, 1) : "—"}
                  </td>
                  {waterfall.allNames.map((n) => {
                    const o = s.ownership.find((x) => x.name === n);
                    return (
                      <td
                        key={n}
                        className="px-4 py-2 text-right font-mono tabular-nums text-gray-700"
                      >
                        {o ? formatPercent(o.percent, 1) : "—"}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[10px] text-gray-400 mt-2">
          Pre-seed splits normalise to 100%. Each future round dilutes existing holders pro-rata
          after the ESOP refresh; new investors receive raise / post-money.
        </p>
      </div>
    </div>
  );
}
