import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Currency } from "./types";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

const DEFAULT_CURRENCY: Currency = { code: "USD", symbol: "$", locale: "en-US" };

const formatterCache = new Map<string, Intl.NumberFormat>();

function getFormatter(locale: string, code: string, fractionDigits: 0 | 2): Intl.NumberFormat {
  const key = `${locale}|${code}|${fractionDigits}`;
  let f = formatterCache.get(key);
  if (!f) {
    f = new Intl.NumberFormat(locale, {
      style: "currency",
      currency: code,
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    });
    formatterCache.set(key, f);
  }
  return f;
}

export function formatCurrency(
  value: number,
  fractionDigits: 0 | 2 = 0,
  currency: Currency = DEFAULT_CURRENCY
): string {
  if (!Number.isFinite(value)) return `${currency.symbol}0`;
  return getFormatter(currency.locale, currency.code, fractionDigits).format(value);
}

export function formatCurrencyCompact(
  value: number,
  currency: Currency = DEFAULT_CURRENCY
): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs >= 1_000_000) return `${sign}${currency.symbol}${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 10_000) return `${sign}${currency.symbol}${Math.round(abs / 1_000)}K`;
  return formatCurrency(value, 0, currency);
}

export function formatPercent(value: number, decimals = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

export function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return "0";
  return new Intl.NumberFormat("en-US").format(Math.round(value));
}
