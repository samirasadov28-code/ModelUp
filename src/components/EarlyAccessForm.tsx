"use client";

import { useState, type FormEvent } from "react";
import { CheckCircle2, KeyRound } from "lucide-react";
import { grantEarlyAccess, isEarlyAccessEmail } from "@/lib/early-access";

interface EarlyAccessFormProps {
  onUnlocked?: () => void;
  compact?: boolean;
}

export function EarlyAccessForm({ onUnlocked, compact = false }: EarlyAccessFormProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "ok" | "no-match">("idle");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (isEarlyAccessEmail(email)) {
      grantEarlyAccess(email);
      setStatus("ok");
      onUnlocked?.();
    } else {
      setStatus("no-match");
    }
  };

  if (status === "ok") {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-6 flex items-start gap-3">
        <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-emerald-800">Early access unlocked</p>
          <p className="text-xs text-emerald-700 mt-0.5">
            Pro features are available on every model you build, on this device.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border border-blue-200 bg-blue-50/60 ${compact ? "p-5" : "p-6 md:p-8"}`}>
      <div className="flex items-center gap-2 mb-2">
        <KeyRound className="w-4 h-4 text-blue-600" />
        <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">Early access</p>
      </div>
      <h3 className={`font-bold text-gray-900 mb-1 ${compact ? "text-base" : "text-lg"}`}>
        Have an invite? Unlock Pro for free.
      </h3>
      <p className="text-sm text-gray-600 mb-4">
        Enter the email on your invite. We&apos;ll unlock the full Pro experience on this device — no card required.
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (status === "no-match") setStatus("idle");
          }}
          placeholder="you@example.com"
          className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400"
        />
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg shadow-sm shadow-blue-500/20 transition-colors"
        >
          Unlock Pro
        </button>
      </form>
      {status === "no-match" && (
        <p className="text-xs text-red-600 mt-2">
          That email isn&apos;t on the early access list yet. Reach out and we&apos;ll add you.
        </p>
      )}
    </div>
  );
}
