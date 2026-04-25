import { ShieldCheck } from "lucide-react";

export function TrustBadge() {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/3 text-xs text-white/40">
      <ShieldCheck className="w-3.5 h-3.5 text-accent-400" />
      Powered by professional financial modeling
    </div>
  );
}
