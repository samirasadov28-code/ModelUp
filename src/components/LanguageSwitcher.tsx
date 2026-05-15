"use client";

import { useEffect, useRef, useState } from "react";
import { Globe, Check } from "lucide-react";
import { useT, SUPPORTED_LOCALES } from "@/i18n/LocaleProvider";
import { getLocaleConfig, type LocaleCode } from "@/i18n/locales";
import { cn } from "@/lib/utils";

/**
 * Compact globe-icon language picker. Renders the current locale's flag
 * inline; clicking opens a popover with all 16 supported locales. Each row
 * shows the flag, the language's self-name, and a check mark next to the
 * active locale.
 */
export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale, t } = useT();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const current = getLocaleConfig(locale);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={t("common.language")}
        title={t("common.language")}
        className={cn(
          "inline-flex items-center gap-1.5 border border-gray-200 bg-white hover:bg-gray-50 rounded-lg transition-colors",
          compact ? "px-2 py-1.5 text-xs" : "px-2.5 py-2 text-sm"
        )}
      >
        <Globe className={cn(compact ? "w-3.5 h-3.5" : "w-4 h-4", "text-gray-500")} />
        <span className="text-base leading-none">{current.flag}</span>
        {!compact && (
          <span className="text-xs font-semibold text-gray-700 hidden sm:inline">
            {current.code.toUpperCase()}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-56 max-h-80 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-xl shadow-gray-900/10 py-1 z-50">
          {SUPPORTED_LOCALES.map((l) => {
            const active = l.code === locale;
            return (
              <button
                key={l.code}
                type="button"
                onClick={() => {
                  setLocale(l.code as LocaleCode);
                  setOpen(false);
                }}
                className={cn(
                  "w-full text-left flex items-center justify-between gap-2 px-3 py-2 text-sm transition-colors",
                  active ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-50"
                )}
              >
                <span className="flex items-center gap-2 min-w-0">
                  <span className="text-base leading-none shrink-0">{l.flag}</span>
                  <span className="truncate">{l.name}</span>
                  <span className="text-[10px] uppercase text-gray-400 font-mono">
                    {l.code}
                  </span>
                </span>
                {active && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
