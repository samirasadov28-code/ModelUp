/**
 * Supported locales. Order is shown in the language switcher.
 *
 * Adding a new locale:
 *   1) add an entry here
 *   2) drop a dictionary file at `src/i18n/dictionaries/<code>.ts` that
 *      mirrors `dictionaries/en.ts`
 *   3) register it in `DICTIONARIES` in `LocaleProvider.tsx`
 */

export interface LocaleConfig {
  code: LocaleCode;
  /** Self-name shown in the language switcher (always in its own script). */
  name: string;
  /** English name for screen-readers and admin labels. */
  englishName: string;
  flag: string;
  rtl: boolean;
}

export type LocaleCode =
  | "en" | "uk" | "fr" | "es" | "de" | "pt" | "it" | "nl"
  | "tr" | "zh" | "ar" | "hi" | "ru" | "bn" | "ja" | "id";

export const LOCALES: LocaleConfig[] = [
  { code: "en", name: "English",   englishName: "English",    flag: "🇬🇧", rtl: false },
  { code: "es", name: "Español",   englishName: "Spanish",    flag: "🇪🇸", rtl: false },
  { code: "fr", name: "Français",  englishName: "French",     flag: "🇫🇷", rtl: false },
  { code: "de", name: "Deutsch",   englishName: "German",     flag: "🇩🇪", rtl: false },
  { code: "pt", name: "Português", englishName: "Portuguese", flag: "🇵🇹", rtl: false },
  { code: "it", name: "Italiano",  englishName: "Italian",    flag: "🇮🇹", rtl: false },
  { code: "nl", name: "Nederlands", englishName: "Dutch",     flag: "🇳🇱", rtl: false },
  { code: "tr", name: "Türkçe",    englishName: "Turkish",    flag: "🇹🇷", rtl: false },
  { code: "uk", name: "Українська", englishName: "Ukrainian", flag: "🇺🇦", rtl: false },
  { code: "ru", name: "Русский",   englishName: "Russian",    flag: "🇷🇺", rtl: false },
  { code: "ar", name: "العربية",   englishName: "Arabic",     flag: "🇸🇦", rtl: true  },
  { code: "hi", name: "हिन्दी",     englishName: "Hindi",      flag: "🇮🇳", rtl: false },
  { code: "bn", name: "বাংলা",      englishName: "Bengali",    flag: "🇧🇩", rtl: false },
  { code: "zh", name: "中文",       englishName: "Chinese",    flag: "🇨🇳", rtl: false },
  { code: "ja", name: "日本語",     englishName: "Japanese",   flag: "🇯🇵", rtl: false },
  { code: "id", name: "Indonesia", englishName: "Indonesian", flag: "🇮🇩", rtl: false },
];

export const DEFAULT_LOCALE: LocaleCode = "en";

export function getLocaleConfig(code: string | undefined): LocaleConfig {
  return LOCALES.find((l) => l.code === code) ?? LOCALES[0];
}

export function isLocale(code: string | null | undefined): code is LocaleCode {
  return !!code && LOCALES.some((l) => l.code === code);
}
