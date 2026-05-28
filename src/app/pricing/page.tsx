import type { Metadata } from "next";
import PricingPageClient from "./PricingPageClient";

export const metadata: Metadata = {
  title: "Pricing — Free preview, Pro is $4.99/mo",
  description:
    "ModelUp Free gives every founder a 5-year P&L summary, cash runway, and break-even year. Pro ($4.99/mo) unlocks interactive charts, unit economics, scenario comparison, cap table waterfall, DCF + WACC builder, sensitivity sliders, an AI funding narrative, and a populated Excel download.",
  alternates: { canonical: "/pricing" },
  openGraph: {
    title: "ModelUp Pricing — Free preview, Pro is $4.99/mo",
    description:
      "Every founder gets a free 5-year P&L. Pro at $4.99/mo unlocks scenarios, valuation, cap table, sensitivity, and the Excel model.",
    url: "/pricing",
    type: "website",
  },
};

export default function PricingPage() {
  return <PricingPageClient />;
}
