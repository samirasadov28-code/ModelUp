import { ShieldCheck } from "lucide-react";

export function TrustBadge() {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 bg-gray-50 text-xs text-gray-600">
      <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
      Powered by professional financial modeling
    </div>
  );
}
