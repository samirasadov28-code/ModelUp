"use client";

import { useEffect } from "react";

/**
 * Registers /service-worker.js once on mount so the app is installable as a
 * PWA and works offline (cached shell). Runs after `load` to keep the
 * critical path clear and silently no-ops in browsers that don't support
 * service workers.
 */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    const register = () => {
      navigator.serviceWorker
        .register("/service-worker.js", { scope: "/" })
        .catch((err) => {
          // eslint-disable-next-line no-console
          console.warn("SW registration failed:", err);
        });
    };
    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", register, { once: true });
    }
  }, []);
  return null;
}
