"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  DEFAULT_LOCALE,
  LOCALES,
  getLocaleConfig,
  isLocale,
  type LocaleCode,
} from "./locales";
import { en } from "./dictionaries/en";
import { es } from "./dictionaries/es";
import { fr } from "./dictionaries/fr";
import { de } from "./dictionaries/de";
import { pt } from "./dictionaries/pt";
import { it } from "./dictionaries/it";
import { nl } from "./dictionaries/nl";
import { tr } from "./dictionaries/tr";
import { uk } from "./dictionaries/uk";
import { ru } from "./dictionaries/ru";
import { ar } from "./dictionaries/ar";
import { hi } from "./dictionaries/hi";
import { bn } from "./dictionaries/bn";
import { zh } from "./dictionaries/zh";
import { ja } from "./dictionaries/ja";
import { id } from "./dictionaries/id";
import type { Dict, DictKey } from "./dictionaries/en";

const DICTIONARIES: Record<LocaleCode, Dict> = {
  en, es, fr, de, pt, it, nl, tr, uk, ru, ar, hi, bn, zh, ja, id,
};

const STORAGE_KEY = "modelup_locale";
const COOKIE_KEY = "modelup_locale";

interface LocaleContextValue {
  locale: LocaleCode;
  setLocale: (code: LocaleCode) => void;
  t: (key: DictKey, params?: Record<string, string | number>) => string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, k) =>
    Object.prototype.hasOwnProperty.call(params, k) ? String(params[k]) : `{${k}}`
  );
}

/**
 * Reads the founder's preferred locale on mount (cookie → localStorage →
 * browser language → English) and applies `<html lang>` + `<html dir>` so
 * Arabic and other RTL locales flip layout direction.
 *
 * SSR always renders English; client hydration swaps to the chosen locale
 * (which causes a brief flash, accepted in this v1 — long-form copy on the
 * landing page is the only place users would notice).
 */
export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<LocaleCode>(DEFAULT_LOCALE);

  useEffect(() => {
    let chosen: LocaleCode = DEFAULT_LOCALE;
    try {
      const fromCookie = document.cookie
        .split(";")
        .map((c) => c.trim())
        .find((c) => c.startsWith(`${COOKIE_KEY}=`));
      if (fromCookie) {
        const v = decodeURIComponent(fromCookie.split("=")[1] ?? "");
        if (isLocale(v)) chosen = v;
      }
      const fromStorage = localStorage.getItem(STORAGE_KEY);
      if (isLocale(fromStorage)) chosen = fromStorage;
      if (!fromCookie && !fromStorage) {
        const browser = (navigator.language || "en").split("-")[0];
        if (isLocale(browser)) chosen = browser;
      }
    } catch {
      /* ignore — fall back to default */
    }
    setLocaleState(chosen);
  }, []);

  useEffect(() => {
    const cfg = getLocaleConfig(locale);
    document.documentElement.lang = cfg.code;
    document.documentElement.dir = cfg.rtl ? "rtl" : "ltr";
  }, [locale]);

  const setLocale = useCallback((code: LocaleCode) => {
    setLocaleState(code);
    try {
      localStorage.setItem(STORAGE_KEY, code);
      // 1-year persistent cookie so future visits hydrate the right locale.
      document.cookie = `${COOKIE_KEY}=${encodeURIComponent(code)};path=/;max-age=${60 * 60 * 24 * 365};SameSite=Lax`;
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo<LocaleContextValue>(() => {
    const dict = DICTIONARIES[locale] ?? en;
    return {
      locale,
      setLocale,
      t: (key, params) => interpolate(dict[key] ?? en[key] ?? key, params),
    };
  }, [locale, setLocale]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useT() {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    // Allow the hook to be safely called from server-rendered components
    // before hydration — returns the English source string.
    return {
      locale: DEFAULT_LOCALE as LocaleCode,
      setLocale: () => {},
      t: (key: DictKey, params?: Record<string, string | number>) =>
        interpolate(en[key] ?? key, params),
    };
  }
  return ctx;
}

export const SUPPORTED_LOCALES = LOCALES;
