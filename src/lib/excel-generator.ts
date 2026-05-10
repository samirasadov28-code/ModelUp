/**
 * Native JS Excel generator with live formulas.
 *
 * The workbook is structured so every downstream sheet recomputes from the
 * `Inputs` sheet — change a tier price, churn rate, growth rate, CAC, burn,
 * tax rate, or funding ask in Inputs and the entire model re-runs in Excel.
 * No source-template files, no Python service.
 *
 * Currency formats follow the model's resolved currency (USD/GBP/EUR/etc.).
 */

import ExcelJS from "exceljs";
import type { Currency, ModelOutputs, QuestionnaireAnswers } from "./types";
import { TAX_JURISDICTION_LABELS } from "./regional";

const HEADER_FILL: ExcelJS.Fill = {
  type: "pattern", pattern: "solid", fgColor: { argb: "FF2563EB" },
};
const SUBHEADER_FILL: ExcelJS.Fill = {
  type: "pattern", pattern: "solid", fgColor: { argb: "FFF3F4F6" },
};
const INPUT_FILL: ExcelJS.Fill = {
  type: "pattern", pattern: "solid", fgColor: { argb: "FFFEF3C7" },
};

const HEADER_FONT: Partial<ExcelJS.Font> = {
  bold: true, color: { argb: "FFFFFFFF" }, size: 11,
};
const TITLE_FONT: Partial<ExcelJS.Font> = {
  bold: true, size: 14, color: { argb: "FF111827" },
};

interface Formats {
  CURRENCY: string;
  CURRENCY_2: string;
  PERCENT: string;
  PERCENT_2: string;
  NUMBER: string;
  RATIO: string;
}

function buildFormats(currency: Currency): Formats {
  const sym = `"${currency.symbol.replace(/"/g, '""')}"`;
  return {
    CURRENCY: `${sym}#,##0`,
    CURRENCY_2: `${sym}#,##0.00`,
    PERCENT: "0.0%",
    PERCENT_2: "0.00%",
    NUMBER: "#,##0",
    RATIO: '0.00"x"',
  };
}

function styleHeaderRow(row: ExcelJS.Row): void {
  row.eachCell((cell) => {
    cell.fill = HEADER_FILL;
    cell.font = HEADER_FONT;
    cell.alignment = { vertical: "middle", horizontal: "center" };
    cell.border = { bottom: { style: "thin", color: { argb: "FF1E3A8A" } } };
  });
  row.height = 22;
}

function styleSectionTitle(cell: ExcelJS.Cell): void {
  cell.font = TITLE_FONT;
  cell.alignment = { vertical: "middle" };
}

/** Highlight a cell as a user-editable input (light yellow). */
function markInput(cell: ExcelJS.Cell): void {
  cell.fill = INPUT_FILL;
}

// ── Inputs sheet — single source of truth for every formula ───────────────
//
// Cell references are stable across workbooks so all downstream sheets can
// reference Inputs!Bn confidently. Keep this layout in sync with INPUT_REFS.

const INPUT_REFS = {
  year1Target: "B4",
  startingCustomers: "B5", // formula = year1Target * 0.05
  monthlyGrowth: "B6",
  monthlyChurn: "B7",
  cogsRate: "B8",
  grossMargin: "B9", // formula = 1 - cogsRate
  monthlyBurn: "B10",
  headcountMultiplier: "B11",
  opexGrowth: "B12",
  cac: "B13",
  taxRate: "B14",
  fundingAsk: "B15",
  // tiers occupy rows 18..21 (up to 4)
  tierStartRow: 18,
  tierNameCol: "B",
  tierPriceCol: "C",
  tierAllocCol: "D",
  blendedArpu: "B24", // formula = SUMPRODUCT(prices, allocs)
} as const;

function tierPriceRange(): string {
  return `Inputs!${INPUT_REFS.tierPriceCol}${INPUT_REFS.tierStartRow}:${INPUT_REFS.tierPriceCol}${INPUT_REFS.tierStartRow + 3}`;
}
function tierAllocRange(): string {
  return `Inputs!${INPUT_REFS.tierAllocCol}${INPUT_REFS.tierStartRow}:${INPUT_REFS.tierAllocCol}${INPUT_REFS.tierStartRow + 3}`;
}

function buildInputsSheet(
  wb: ExcelJS.Workbook,
  answers: QuestionnaireAnswers,
  taxRate: number,
  fmt: Formats
): void {
  const ws = wb.addWorksheet("Inputs", { properties: { tabColor: { argb: "FF6366F1" } } });

  ws.getColumn(1).width = 32;
  ws.getColumn(2).width = 18;
  ws.getColumn(3).width = 18;
  ws.getColumn(4).width = 16;
  ws.getColumn(5).width = 50;

  ws.mergeCells("A1:E1");
  const title = ws.getCell("A1");
  title.value = "Model inputs — change any cell highlighted yellow";
  styleSectionTitle(title);

  ws.mergeCells("A2:E2");
  const sub = ws.getCell("A2");
  sub.value =
    "Every other sheet recalculates from these values. Tax base: " +
    (answers.taxJurisdiction ? TAX_JURISDICTION_LABELS[answers.taxJurisdiction] : "Not specified") +
    " · effective corporate tax shown in cell B14.";
  sub.font = { italic: true, color: { argb: "FF6B7280" } };

  ws.getRow(3).values = ["Field", "Value", "", "", "Notes"];
  styleHeaderRow(ws.getRow(3));

  // Resolve numeric values from answers (engine has these computed).
  const churnRate =
    answers.monthlyChurnRate > 0
      ? answers.monthlyChurnRate / 100
      : answers.churnEstimate === "lt2" ? 0.015
      : answers.churnEstimate === "2to5" ? 0.035
      : answers.churnEstimate === "5to10" ? 0.075
      : answers.churnEstimate === "gt10" ? 0.12
      : 0.05;

  const growthRate =
    answers.growthCurve === "conservative" ? 0.04
    : answers.growthCurve === "aggressive" ? 0.18
    : 0.09;

  const cogsRate =
    answers.businessModel === "saas" ? 0.18
    : answers.businessModel === "marketplace" ? 0.35
    : answers.businessModel === "product" ? 0.45
    : answers.businessModel === "service" ? 0.25
    : 0.30;

  const headcountMultiplier =
    answers.headcount === "6–15" || answers.headcount === "6-15" ? 1.3
    : answers.headcount === "15+" ? 1.6
    : 1.0;

  type Row =
    | { row: number; label: string; value: number | string; numFmt?: string; input?: boolean; note?: string }
    | { row: number; label: string; formula: string; numFmt?: string; note?: string };

  const rows: Row[] = [
    { row: 4, label: "Year-1 customer target", value: answers.year1UserTarget || 100, numFmt: fmt.NUMBER, input: true, note: "End-of-year-1 paying customers" },
    { row: 5, label: "Starting customers (M1)", formula: `=${INPUT_REFS.year1Target}*0.05`, numFmt: fmt.NUMBER, note: "5% of Y1 target — the model boots from this" },
    { row: 6, label: "Monthly customer growth", value: growthRate, numFmt: fmt.PERCENT_2, input: true, note: "Per-month growth rate of the customer base" },
    { row: 7, label: "Monthly churn", value: churnRate, numFmt: fmt.PERCENT_2, input: true, note: "Per-month customer cancellation rate" },
    { row: 8, label: "COGS rate", value: cogsRate, numFmt: fmt.PERCENT, input: true, note: "Cost of revenue as % of revenue" },
    { row: 9, label: "Gross margin", formula: `=1-${INPUT_REFS.cogsRate}`, numFmt: fmt.PERCENT, note: "1 − COGS rate" },
    { row: 10, label: "Monthly burn (today)", value: answers.monthlyBurn, numFmt: fmt.CURRENCY, input: true, note: "All-in spend — salaries + tools + infra" },
    { row: 11, label: "Headcount OpEx multiplier", value: headcountMultiplier, numFmt: "0.00", input: true, note: "1× (≤5), 1.3× (6–15), 1.6× (15+)" },
    { row: 12, label: "OpEx monthly growth", value: 0.008, numFmt: fmt.PERCENT_2, input: true, note: "OpEx creep per month for hiring + tools" },
    { row: 13, label: "CAC", value: answers.cac || 0, numFmt: fmt.CURRENCY, input: true, note: "All-in customer acquisition cost" },
    { row: 14, label: "Effective corporate tax rate", value: taxRate, numFmt: fmt.PERCENT, input: true, note: "Driven by tax jurisdiction; edit if you have a specific rate" },
    { row: 15, label: "Funding ask", value: answers.fundingAsk, numFmt: fmt.CURRENCY, input: true, note: "Capital raised — opening cash for the model" },
  ];

  rows.forEach((r) => {
    const row = ws.getRow(r.row);
    row.getCell(1).value = r.label;
    row.getCell(1).font = { bold: true, color: { argb: "FF374151" } };
    if ("formula" in r) {
      row.getCell(2).value = { formula: r.formula };
    } else {
      row.getCell(2).value = r.value;
      if (r.input) markInput(row.getCell(2));
    }
    if (r.numFmt) row.getCell(2).numFmt = r.numFmt;
    if (r.note) {
      ws.mergeCells(`E${r.row}:F${r.row}`);
      row.getCell(5).value = r.note;
      row.getCell(5).font = { color: { argb: "FF6B7280" }, size: 10 };
      row.getCell(5).alignment = { wrapText: true };
    }
  });

  // Tiers ─ rows 17-21 plus a SUMPRODUCT in row 24.
  const tierTitleRow = ws.getRow(17);
  tierTitleRow.getCell(1).value = "Pricing tiers (edit price & allocation — must sum to 100%)";
  tierTitleRow.getCell(1).font = { bold: true, color: { argb: "FF374151" } };
  ws.getRow(17).values = ["Tier name", "", "Monthly price", "Allocation %"];
  styleHeaderRow(ws.getRow(17));

  // Pad to 4 rows so SUMPRODUCT covers a fixed range regardless of input count.
  const tiers = answers.tiers.slice(0, 4);
  while (tiers.length < 4) tiers.push({ name: "", monthlyPrice: 0, allocationPercent: 0 });

  tiers.forEach((t, i) => {
    const r = INPUT_REFS.tierStartRow + i;
    const row = ws.getRow(r);
    row.getCell(1).value = `Tier ${i + 1}`;
    row.getCell(1).font = { color: { argb: "FF6B7280" } };
    row.getCell(2).value = t.name || "";
    markInput(row.getCell(2));
    row.getCell(3).value = t.monthlyPrice;
    row.getCell(3).numFmt = fmt.CURRENCY_2;
    markInput(row.getCell(3));
    row.getCell(4).value = (t.allocationPercent || 0) / 100;
    row.getCell(4).numFmt = fmt.PERCENT;
    markInput(row.getCell(4));
  });

  // Allocation total (row 22) and blended ARPU (row 24).
  const totalRow = ws.getRow(22);
  totalRow.getCell(1).value = "Allocation total (must equal 100%)";
  totalRow.getCell(1).font = { italic: true, color: { argb: "FF6B7280" } };
  totalRow.getCell(4).value = { formula: `=SUM(${tierAllocRange()})` };
  totalRow.getCell(4).numFmt = fmt.PERCENT;

  const arpuRow = ws.getRow(24);
  arpuRow.getCell(1).value = "Blended monthly ARPU (computed)";
  arpuRow.getCell(1).font = { bold: true, color: { argb: "FF374151" } };
  arpuRow.getCell(2).value = {
    formula: `=SUMPRODUCT(${tierPriceRange()},${tierAllocRange()})`,
  };
  arpuRow.getCell(2).numFmt = fmt.CURRENCY_2;
  ws.mergeCells("E24:F24");
  arpuRow.getCell(5).value =
    "= Σ (tier price × tier allocation). Drives revenue on the Monthly sheet.";
  arpuRow.getCell(5).font = { color: { argb: "FF6B7280" }, size: 10 };
}

// ── Monthly sheet — 36 rows of live formulas ──────────────────────────────

const MONTHLY_SHEET = "Monthly";
const MONTHS = 36;

function buildMonthlySheet(wb: ExcelJS.Workbook, model: ModelOutputs, fmt: Formats): void {
  const ws = wb.addWorksheet(MONTHLY_SHEET, { properties: { tabColor: { argb: "FF14B8A6" } } });
  const title = ws.getCell("A1");
  title.value = `Monthly P&L — formulas reference Inputs (${model.currency.code})`;
  styleSectionTitle(title);
  ws.mergeCells("A1:M1");

  const note = ws.getCell("A2");
  note.value = "Edit Inputs to recalculate every cell here automatically.";
  note.font = { italic: true, color: { argb: "FF6B7280" } };
  ws.mergeCells("A2:M2");

  const headerRow = ws.getRow(4);
  headerRow.values = [
    "Month", "Label",
    "Customers (start)", "New", "Churned", "Customers (end)",
    "Revenue", "COGS", "Gross profit",
    "OpEx", "EBITDA", "Net income (post-tax)",
    "Closing cash",
  ];
  styleHeaderRow(headerRow);

  const dataStart = 5; // first row of monthly data
  const startDate = model.answers.modelStartDate ? new Date(model.answers.modelStartDate) : new Date();

  for (let m = 0; m < MONTHS; m++) {
    const r = dataStart + m;
    const row = ws.getRow(r);

    const d = new Date(startDate);
    d.setMonth(d.getMonth() + m);
    const label = d.toLocaleString("default", { month: "short", year: "2-digit" });

    row.getCell(1).value = m + 1;
    row.getCell(2).value = label;

    if (m === 0) {
      // Month 1 — boots from starting customers.
      row.getCell(3).value = { formula: `=Inputs!${INPUT_REFS.startingCustomers}` };
    } else {
      // Subsequent months — start = previous month's end.
      row.getCell(3).value = { formula: `=F${r - 1}` };
    }
    // New = start × growth, Churned = start × churn
    row.getCell(4).value = { formula: `=C${r}*Inputs!${INPUT_REFS.monthlyGrowth}` };
    row.getCell(5).value = { formula: `=C${r}*Inputs!${INPUT_REFS.monthlyChurn}` };
    // End customers
    row.getCell(6).value = { formula: `=MAX(0,C${r}+D${r}-E${r})` };
    // Revenue = end customers × blended ARPU
    row.getCell(7).value = { formula: `=F${r}*Inputs!${INPUT_REFS.blendedArpu}` };
    // COGS = revenue × cogs rate
    row.getCell(8).value = { formula: `=G${r}*Inputs!${INPUT_REFS.cogsRate}` };
    // Gross profit
    row.getCell(9).value = { formula: `=G${r}-H${r}` };
    // OpEx = base burn × headcount × (1 + opex_growth × month_index)
    row.getCell(10).value = {
      formula: `=Inputs!${INPUT_REFS.monthlyBurn}*Inputs!${INPUT_REFS.headcountMultiplier}*(1+Inputs!${INPUT_REFS.opexGrowth}*${m})`,
    };
    // EBITDA
    row.getCell(11).value = { formula: `=I${r}-J${r}` };
    // Net income (post-tax)
    row.getCell(12).value = { formula: `=K${r}-MAX(0,K${r}*Inputs!${INPUT_REFS.taxRate})` };
    // Closing cash
    if (m === 0) {
      row.getCell(13).value = { formula: `=MAX(0,Inputs!${INPUT_REFS.fundingAsk}+L${r})` };
    } else {
      row.getCell(13).value = { formula: `=MAX(0,M${r - 1}+L${r})` };
    }

    [3, 4, 5, 6].forEach((c) => (row.getCell(c).numFmt = fmt.NUMBER));
    [7, 8, 9, 10, 11, 12, 13].forEach((c) => (row.getCell(c).numFmt = fmt.CURRENCY));

    if ((m + 1) % 12 === 0) {
      row.eachCell((cell) => (cell.fill = SUBHEADER_FILL));
      row.font = { bold: true };
    }
  }

  ws.getColumn(1).width = 8;
  ws.getColumn(2).width = 10;
  for (let c = 3; c <= 13; c++) ws.getColumn(c).width = 16;
  ws.views = [{ state: "frozen", ySplit: 4 }];
}

// ── Annual sheet — SUM ranges of Monthly ──────────────────────────────────

function buildAnnualSheet(wb: ExcelJS.Workbook, model: ModelOutputs, fmt: Formats): void {
  const ws = wb.addWorksheet("Annual", { properties: { tabColor: { argb: "FF10B981" } } });
  const title = ws.getCell("A1");
  title.value = `Income Statement — annual roll-up of Monthly (${model.currency.code})`;
  styleSectionTitle(title);
  ws.mergeCells("A1:E1");

  const note = ws.getCell("A2");
  note.value = "Each cell is a SUM (or MAX/MIN) over the corresponding 12 months on the Monthly sheet.";
  note.font = { italic: true, color: { argb: "FF6B7280" } };
  ws.mergeCells("A2:E2");

  ws.getRow(4).values = ["Metric", "Year 1", "Year 2", "Year 3", "Y3 vs Y1"];
  styleHeaderRow(ws.getRow(4));

  // Monthly!{col}{startRow}..{col}{startRow+11} for Y1, etc.
  const range = (col: string, year: 1 | 2 | 3): string => {
    const start = 5 + (year - 1) * 12;
    const end = start + 11;
    return `${MONTHLY_SHEET}!${col}${start}:${col}${end}`;
  };
  const lastMonthCell = (col: string, year: 1 | 2 | 3): string => {
    const r = 5 + year * 12 - 1;
    return `${MONTHLY_SHEET}!${col}${r}`;
  };

  type AnnualRow =
    | { label: string; col: string; kind: "sum-currency"; bold?: boolean }
    | { label: string; col: string; kind: "last-customers"; bold?: boolean }
    | { label: string; col: string; kind: "arr"; bold?: boolean }
    | { label: string; numerator: string; denominator: string; kind: "ratio"; bold?: boolean };

  const rows: AnnualRow[] = [
    { label: "Revenue", col: "G", kind: "sum-currency", bold: true },
    { label: "COGS", col: "H", kind: "sum-currency" },
    { label: "Gross profit", col: "I", kind: "sum-currency", bold: true },
    { label: "Gross margin", numerator: "I", denominator: "G", kind: "ratio" },
    { label: "OpEx", col: "J", kind: "sum-currency" },
    { label: "EBITDA", col: "K", kind: "sum-currency", bold: true },
    { label: "EBITDA margin", numerator: "K", denominator: "G", kind: "ratio" },
    { label: "Net income (post-tax)", col: "L", kind: "sum-currency", bold: true },
    { label: "Ending customers", col: "F", kind: "last-customers" },
    { label: "Year-end ARR", col: "G", kind: "arr", bold: true },
  ];

  let r = 5;
  rows.forEach((def) => {
    const row = ws.getRow(r++);
    row.getCell(1).value = def.label;
    if (def.bold) row.getCell(1).font = { bold: true };

    [1, 2, 3].forEach((yr, idx) => {
      const cell = row.getCell(2 + idx);
      const yearN = yr as 1 | 2 | 3;
      if (def.kind === "sum-currency") {
        cell.value = { formula: `=SUM(${range(def.col, yearN)})` };
        cell.numFmt = fmt.CURRENCY;
      } else if (def.kind === "last-customers") {
        cell.value = { formula: `=${lastMonthCell(def.col, yearN)}` };
        cell.numFmt = fmt.NUMBER;
      } else if (def.kind === "arr") {
        cell.value = { formula: `=${lastMonthCell(def.col, yearN)}*12` };
        cell.numFmt = fmt.CURRENCY;
      } else if (def.kind === "ratio") {
        const numRange = range(def.numerator, yearN);
        const denRange = range(def.denominator, yearN);
        cell.value = { formula: `=IFERROR(SUM(${numRange})/SUM(${denRange}),0)` };
        cell.numFmt = fmt.PERCENT;
      }
    });

    // Y3 vs Y1 column
    const deltaCell = row.getCell(5);
    if (def.kind === "ratio") {
      deltaCell.value = { formula: `=D${r - 1}-B${r - 1}` };
      deltaCell.numFmt = fmt.PERCENT;
    } else {
      deltaCell.value = { formula: `=IFERROR((D${r - 1}-B${r - 1})/ABS(B${r - 1}),0)` };
      deltaCell.numFmt = fmt.PERCENT;
    }
  });

  ws.getColumn(1).width = 26;
  [2, 3, 4, 5].forEach((c) => (ws.getColumn(c).width = 18));
}

// ── Unit Economics — formulas ─────────────────────────────────────────────

function buildUnitEconSheet(wb: ExcelJS.Workbook, model: ModelOutputs, fmt: Formats): void {
  const ws = wb.addWorksheet("UnitEcon", { properties: { tabColor: { argb: "FFF59E0B" } } });
  const title = ws.getCell("A1");
  title.value = `Unit Economics — formulas off Inputs and Monthly (${model.currency.code})`;
  styleSectionTitle(title);
  ws.mergeCells("A1:C1");

  ws.getRow(3).values = ["Metric", "Value", "Formula"];
  styleHeaderRow(ws.getRow(3));

  const m12Revenue = `${MONTHLY_SHEET}!G16`; // row 16 = month 12 (data starts row 5)
  const m12Customers = `${MONTHLY_SHEET}!F16`;
  const arpuRef = `Inputs!${INPUT_REFS.blendedArpu}`;
  const gmRef = `Inputs!${INPUT_REFS.grossMargin}`;
  const churnRef = `Inputs!${INPUT_REFS.monthlyChurn}`;
  const cacRef = `Inputs!${INPUT_REFS.cac}`;

  const rows: { label: string; formula: string; numFmt: string; note: string }[] = [
    {
      label: "Blended ARPU (M12)",
      formula: `=IFERROR(${m12Revenue}/${m12Customers},${arpuRef})`,
      numFmt: fmt.CURRENCY_2,
      note: "Month-12 revenue ÷ month-12 customers (matches blended ARPU on Inputs).",
    },
    {
      label: "Gross margin",
      formula: `=${gmRef}`,
      numFmt: fmt.PERCENT,
      note: "1 − COGS rate.",
    },
    {
      label: "CAC",
      formula: `=${cacRef}`,
      numFmt: fmt.CURRENCY_2,
      note: "From Inputs — change there to recompute LTV / payback.",
    },
    {
      label: "LTV",
      formula: `=IFERROR((${arpuRef}*${gmRef})/${churnRef},0)`,
      numFmt: fmt.CURRENCY_2,
      note: "(ARPU × gross margin) ÷ churn — recomputes from Inputs.",
    },
    {
      label: "LTV / CAC",
      formula: `=IFERROR(((${arpuRef}*${gmRef})/${churnRef})/${cacRef},0)`,
      numFmt: fmt.RATIO,
      note: "≥3× healthy, 1–3× acceptable, <1× problematic.",
    },
    {
      label: "CAC payback (months)",
      formula: `=IFERROR(${cacRef}/(${arpuRef}*${gmRef}),0)`,
      numFmt: "0.0",
      note: "CAC ÷ (ARPU × gross margin).",
    },
  ];

  let r = 4;
  rows.forEach((row) => {
    const wsRow = ws.getRow(r++);
    wsRow.getCell(1).value = row.label;
    wsRow.getCell(2).value = { formula: row.formula };
    wsRow.getCell(2).numFmt = row.numFmt;
    wsRow.getCell(3).value = row.note;
    wsRow.getCell(3).font = { color: { argb: "FF6B7280" }, size: 10 };
    wsRow.getCell(3).alignment = { wrapText: true };
  });

  ws.getColumn(1).width = 24;
  ws.getColumn(2).width = 18;
  ws.getColumn(3).width = 60;
}

// ── Cap Table — formulas ──────────────────────────────────────────────────

function buildCapTableSheet(wb: ExcelJS.Workbook, model: ModelOutputs, fmt: Formats): void {
  const ws = wb.addWorksheet("CapTable", { properties: { tabColor: { argb: "FFEC4899" } } });
  const title = ws.getCell("A1");
  title.value = `Cap Table — formulas reference Annual Y1 ARR + Inputs.fundingAsk (${model.currency.code})`;
  styleSectionTitle(title);
  ws.mergeCells("A1:E1");

  // Inputs we need
  const fundingRef = `Inputs!${INPUT_REFS.fundingAsk}`;
  // Y1 ARR is on the Annual sheet — row 14 column B (Year-end ARR is the 10th metric)
  // We computed annual rows in order: Revenue, COGS, GP, GM, OpEx, EBITDA, EM, NI, EndCust, ARR
  // First row is row 5, so ARR is row 14.
  const arrY1Ref = `Annual!B14`;
  const stageMultiple = model.capTable.preMoneyValuation > 0 && model.annual[0].arr > 0
    ? Math.round((model.capTable.preMoneyValuation / model.annual[0].arr) * 10) / 10
    : 10;

  // Summary rows
  const sum: { label: string; valueOrFormula: number | { formula: string }; numFmt: string; note?: string; input?: boolean }[] = [
    {
      label: "Stage × jurisdiction valuation multiple",
      valueOrFormula: stageMultiple,
      numFmt: '0.0"x"',
      input: true,
      note: "Edit to re-price the round (US baseline 10×; UK/EU 0.85×; etc.).",
    },
    {
      label: "Pre-money valuation",
      valueOrFormula: { formula: `=${arrY1Ref}*B3` },
      numFmt: fmt.CURRENCY,
      note: "= Y1 ARR × stage multiple (cell B3).",
    },
    {
      label: "Raise amount",
      valueOrFormula: { formula: `=${fundingRef}` },
      numFmt: fmt.CURRENCY,
    },
    {
      label: "Post-money valuation",
      valueOrFormula: { formula: `=B4+B5` },
      numFmt: fmt.CURRENCY,
    },
    {
      label: "New investor equity %",
      valueOrFormula: { formula: `=IFERROR(B5/B6,0)` },
      numFmt: fmt.PERCENT,
    },
    {
      label: "Founders equity % (post-raise)",
      valueOrFormula: { formula: `=1-B7` },
      numFmt: fmt.PERCENT,
    },
  ];

  let r = 3;
  sum.forEach((s) => {
    const row = ws.getRow(r++);
    row.getCell(1).value = s.label;
    row.getCell(1).font = { bold: true };
    if (typeof s.valueOrFormula === "number") {
      row.getCell(2).value = s.valueOrFormula;
      if (s.input) markInput(row.getCell(2));
    } else {
      row.getCell(2).value = s.valueOrFormula;
    }
    row.getCell(2).numFmt = s.numFmt;
    if (s.note) {
      row.getCell(3).value = s.note;
      row.getCell(3).font = { color: { argb: "FF6B7280" }, size: 10 };
    }
  });

  // Cap table breakdown — uses the equity formulas above.
  r += 1;
  const tableStart = r;
  ws.getRow(r).values = ["Shareholder", "Shares pre-raise", "% pre-raise", "Shares post-raise", "% post-raise"];
  styleHeaderRow(ws.getRow(r));
  r += 1;

  // Founders
  const foundersRow = ws.getRow(r++);
  foundersRow.getCell(1).value = "Founders";
  foundersRow.getCell(2).value = 10_000_000;
  foundersRow.getCell(2).numFmt = fmt.NUMBER;
  foundersRow.getCell(3).value = 1;
  foundersRow.getCell(3).numFmt = fmt.PERCENT;
  // Post-raise founder shares = total pre × founders pct
  foundersRow.getCell(4).value = { formula: `=B${r - 1}*B8` };
  foundersRow.getCell(4).numFmt = fmt.NUMBER;
  foundersRow.getCell(5).value = { formula: `=B8` };
  foundersRow.getCell(5).numFmt = fmt.PERCENT;

  // Investors
  const investorsRow = ws.getRow(r++);
  investorsRow.getCell(1).value = "New Investors";
  investorsRow.getCell(2).value = 0;
  investorsRow.getCell(2).numFmt = fmt.NUMBER;
  investorsRow.getCell(3).value = 0;
  investorsRow.getCell(3).numFmt = fmt.PERCENT;
  // New shares = founders pre × (newEquity / foundersPct)
  investorsRow.getCell(4).value = { formula: `=IFERROR(B${tableStart + 1}*B7/B8,0)` };
  investorsRow.getCell(4).numFmt = fmt.NUMBER;
  investorsRow.getCell(5).value = { formula: `=B7` };
  investorsRow.getCell(5).numFmt = fmt.PERCENT;

  ws.getColumn(1).width = 28;
  for (let i = 2; i <= 5; i++) ws.getColumn(i).width = 18;
  ws.getColumn(3).width = 60;
}

// ── Static sheets (Cover, Scenarios, Sensitivity) ─────────────────────────

function buildCoverSheet(wb: ExcelJS.Workbook, model: ModelOutputs, fmt: Formats): void {
  const ws = wb.addWorksheet("Cover", { properties: { tabColor: { argb: "FF2563EB" } } });
  const a = model.answers;
  const company = a.companyName || "Your business";

  ws.getColumn(1).width = 32;
  ws.getColumn(2).width = 60;

  ws.mergeCells("A1:B1");
  const title = ws.getCell("A1");
  title.value = `${company} — 3-Year Financial Model`;
  title.font = { bold: true, size: 18, color: { argb: "FF111827" } };
  ws.getRow(1).height = 32;

  ws.mergeCells("A2:B2");
  const sub = ws.getCell("A2");
  sub.value = `Generated by ModelUp on ${new Date(model.createdAt).toLocaleDateString()}`;
  sub.font = { italic: true, color: { argb: "FF6B7280" } };

  const taxJurLabel = a.taxJurisdiction
    ? TAX_JURISDICTION_LABELS[a.taxJurisdiction]
    : "Not specified";

  const rows: [string, string | number][] = [
    ["Business model", a.businessModel],
    ["Customer type", a.customerType],
    ["Primary market", a.geography.toUpperCase()],
    ["Tax base", taxJurLabel],
    ["Reporting currency", `${model.currency.code} (${model.currency.symbol})`],
    ["Corporate tax rate", `${(model.taxRate * 100).toFixed(1)}%`],
    ["Funding stage", a.fundingStage],
    ["Growth scenario", a.growthCurve],
    ["Funding ask", a.fundingAsk],
    ["Target runway (months)", a.targetRunway],
  ];

  let r = 4;
  rows.forEach(([k, v]) => {
    const row = ws.getRow(r++);
    row.getCell(1).value = k;
    row.getCell(1).font = { bold: true, color: { argb: "FF374151" } };
    row.getCell(2).value = v;
    if (typeof v === "number" && (k.includes("ask") || k.includes("burn"))) {
      row.getCell(2).numFmt = fmt.CURRENCY;
    }
  });

  r += 1;
  const noteCell = ws.getCell(`A${r}`);
  ws.mergeCells(`A${r}:B${r + 6}`);
  noteCell.value =
    "How this workbook is structured:\n" +
    "  • Inputs — every assumption (yellow cells = editable). Change any of them and the rest recomputes.\n" +
    "  • Monthly — 36 months of live formulas referencing Inputs + the previous row.\n" +
    "  • Annual — SUM ranges of Monthly, year by year.\n" +
    "  • UnitEcon — ARPU, LTV, LTV/CAC, payback, all formula-driven.\n" +
    "  • CapTable — pre/post-raise driven by Annual Y1 ARR × multiple.\n" +
    "  • Scenarios + Sensitivity — point-in-time snapshots from the engine (not live formulas).";
  noteCell.alignment = { vertical: "top", wrapText: true };
  noteCell.font = { color: { argb: "FF374151" } };
}

function buildScenariosSheet(wb: ExcelJS.Workbook, model: ModelOutputs, fmt: Formats): void {
  const ws = wb.addWorksheet("Scenarios", { properties: { tabColor: { argb: "FF8B5CF6" } } });
  const title = ws.getCell("A1");
  title.value = `Scenario comparison — engine snapshot (${model.currency.code})`;
  styleSectionTitle(title);
  ws.mergeCells("A1:D1");

  const note = ws.getCell("A2");
  note.value =
    "These are pre-computed at base/conservative/aggressive growth curves. The Inputs/Monthly sheets reflect only the selected scenario.";
  note.font = { italic: true, color: { argb: "FF6B7280" } };
  ws.mergeCells("A2:D2");

  ws.getRow(4).values = ["Metric", "Conservative", "Base", "Aggressive"];
  styleHeaderRow(ws.getRow(4));

  const s = model.scenarios;
  const rows: [string, number, number, number, "$" | "n"][] = [
    ["Revenue Y1", s.conservative.revenueY1, s.base.revenueY1, s.aggressive.revenueY1, "$"],
    ["Revenue Y2", s.conservative.revenueY2, s.base.revenueY2, s.aggressive.revenueY2, "$"],
    ["Revenue Y3", s.conservative.revenueY3, s.base.revenueY3, s.aggressive.revenueY3, "$"],
    ["ARR (EoY3)", s.conservative.arrY3, s.base.arrY3, s.aggressive.arrY3, "$"],
    ["EBITDA Y3", s.conservative.ebitdaY3, s.base.ebitdaY3, s.aggressive.ebitdaY3, "$"],
    ["Customers Y3", s.conservative.totalUsersY3, s.base.totalUsersY3, s.aggressive.totalUsersY3, "n"],
    ["Runway (months)", s.conservative.runwayMonths, s.base.runwayMonths, s.aggressive.runwayMonths, "n"],
  ];

  let r = 5;
  rows.forEach(([label, c, b, a, kind]) => {
    const row = ws.getRow(r++);
    row.getCell(1).value = label;
    row.getCell(1).font = { bold: true };
    row.getCell(2).value = c;
    row.getCell(3).value = b;
    row.getCell(4).value = a;
    [2, 3, 4].forEach((col) => (row.getCell(col).numFmt = kind === "$" ? fmt.CURRENCY : fmt.NUMBER));
  });

  ws.getColumn(1).width = 20;
  [2, 3, 4].forEach((c) => (ws.getColumn(c).width = 18));
}

function buildSensitivitySheet(wb: ExcelJS.Workbook, model: ModelOutputs, fmt: Formats): void {
  const ws = wb.addWorksheet("Sensitivity", { properties: { tabColor: { argb: "FFEF4444" } } });
  const title = ws.getCell("A1");
  title.value = `Sensitivity analysis — Year 3 ARR & runway (${model.currency.code})`;
  styleSectionTitle(title);
  ws.mergeCells("A1:F1");

  const note = ws.getCell("A2");
  note.value =
    "Each row varies a single input by ±10% / ±25%. For a fully-live what-if, change the corresponding cell on the Inputs sheet — the Monthly and Annual sheets recompute.";
  note.font = { italic: true, color: { argb: "FF6B7280" } };
  ws.mergeCells("A2:F2");

  ws.getRow(4).values = ["Variable", "−25%", "−10%", "Base", "+10%", "+25%"];
  styleHeaderRow(ws.getRow(4));

  const a = model.answers;
  const baseY3Arr = model.annual[2].arr;
  const baseRunway = model.runway.runwayMonths;

  const variations: { label: string; series: number[]; isRunway: boolean }[] = [
    {
      label: "ARR sensitivity to growth ± (Y3 ARR)",
      series: [-0.25, -0.1, 0, 0.1, 0.25].map((d) => baseY3Arr * (1 + d * 1.4)),
      isRunway: false,
    },
    {
      label: "ARR sensitivity to churn ± (Y3 ARR)",
      series: [-0.25, -0.1, 0, 0.1, 0.25].map((d) => baseY3Arr * (1 - d * 0.8)),
      isRunway: false,
    },
    {
      label: "Runway sensitivity to monthly burn (months)",
      series: [-0.25, -0.1, 0, 0.1, 0.25].map((d) =>
        Math.max(1, Math.round(a.fundingAsk / (a.monthlyBurn * (1 + d))))
      ),
      isRunway: true,
    },
    {
      label: "ARR sensitivity to ARPU (Y3 ARR)",
      series: [-0.25, -0.1, 0, 0.1, 0.25].map((d) => baseY3Arr * (1 + d)),
      isRunway: false,
    },
    {
      label: "Runway sensitivity to funding ask (months)",
      series: [-0.25, -0.1, 0, 0.1, 0.25].map((d) =>
        Math.max(1, Math.round((a.fundingAsk * (1 + d)) / a.monthlyBurn))
      ),
      isRunway: true,
    },
  ];

  let r = 5;
  variations.forEach((v) => {
    const row = ws.getRow(r++);
    row.getCell(1).value = v.label;
    row.getCell(1).font = { bold: true };
    v.series.forEach((val, i) => {
      const cell = row.getCell(2 + i);
      cell.value = val;
      cell.numFmt = v.isRunway ? "0" : fmt.CURRENCY;
    });
  });

  ws.getColumn(1).width = 42;
  for (let i = 2; i <= 6; i++) ws.getColumn(i).width = 16;
}

// ── Public API ─────────────────────────────────────────────────────────────

export async function generateExcelBuffer(model: ModelOutputs): Promise<ArrayBuffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "ModelUp";
  wb.created = new Date();
  // Make sure Excel/Sheets recompute the formulas the moment the file opens.
  wb.calcProperties.fullCalcOnLoad = true;

  const fmt = buildFormats(model.currency);

  buildCoverSheet(wb, model, fmt);
  buildInputsSheet(wb, model.answers, model.taxRate, fmt);
  buildMonthlySheet(wb, model, fmt);
  buildAnnualSheet(wb, model, fmt);
  buildUnitEconSheet(wb, model, fmt);
  buildCapTableSheet(wb, model, fmt);
  buildScenariosSheet(wb, model, fmt);
  buildSensitivitySheet(wb, model, fmt);

  return (await wb.xlsx.writeBuffer()) as ArrayBuffer;
}
