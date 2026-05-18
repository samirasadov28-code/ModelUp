"use client";

import { useT } from "@/i18n/LocaleProvider";

export function NewModelHeader() {
  const { t } = useT();
  return (
    <div className="text-center mb-10">
      <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-3 tracking-tight">
        {t("newpage.title")}
      </h1>
      <p className="text-gray-500 max-w-md mx-auto">{t("newpage.subtitle")}</p>
    </div>
  );
}
