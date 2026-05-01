"use client";

import { RefreshCw } from "lucide-react";
import { useState } from "react";

export function ForceUpdateButton() {
  const [busy, setBusy] = useState(false);

  async function forceUpdate() {
    setBusy(true);
    try {
      // Clear caches (service workers / PWA)
      if (typeof caches !== "undefined") {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
      // Unregister service workers if any
      if ("serviceWorker" in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
      }
      // Clear our localStorage model cache to force re-fetch
      try {
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const k = localStorage.key(i);
          if (k && k.startsWith("modelup_model_")) localStorage.removeItem(k);
        }
      } catch {}
    } finally {
      // Hard reload, bypassing browser cache
      const url = new URL(window.location.href);
      url.searchParams.set("v", Date.now().toString());
      window.location.replace(url.toString());
    }
  }

  return (
    <button
      type="button"
      onClick={forceUpdate}
      disabled={busy}
      className="inline-flex items-center gap-1.5 text-gray-400 text-xs hover:text-blue-600 transition-colors disabled:opacity-50"
      title="Clear cache and reload to the latest version"
    >
      <RefreshCw className={`w-3 h-3 ${busy ? "animate-spin" : ""}`} />
      {busy ? "Updating…" : "Force update"}
    </button>
  );
}
