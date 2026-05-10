import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { FeedbackButton } from "@/components/FeedbackButton";
import { ChatWidget } from "@/components/ChatWidget";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? "G-P2KEZWEVZ8";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://modelups.netlify.app";

export const metadata: Metadata = {
  title: {
    default: "ModelUp — The AI Co-Pilot for Founder Financials",
    template: "%s — ModelUp",
  },
  description:
    "AI-powered financial modeling for founders. Describe your startup in a sentence — get a 5-year P&L, cash flow statement, DCF + EBITDA-multiple valuation, cap table, and investor narrative in 30 seconds.",
  keywords: [
    "AI financial model",
    "AI startup financial model",
    "AI fundraising model",
    "AI DCF valuation",
    "startup financial model",
    "pitch deck financials",
    "SaaS financial projections",
  ],
  metadataBase: new URL(APP_URL),
  icons: {
    icon: [
      { url: "/Logo_192.png", sizes: "192x192", type: "image/png" },
      { url: "/Logo_512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/Logo_192.png", sizes: "192x192", type: "image/png" }],
    shortcut: "/Logo_192.png",
  },
  manifest: "/manifest.webmanifest",
  openGraph: {
    type: "website",
    siteName: "ModelUp",
    title: "ModelUp — The AI Co-Pilot for Founder Financials",
    description:
      "AI-powered financial modeling. Describe your startup in a sentence — get a 5-year P&L, cash flow, DCF + EBITDA-multiple valuation, and cap table in 30 seconds.",
    url: APP_URL,
    images: [
      {
        url: "/Logo_512.png",
        width: 512,
        height: 512,
        alt: "ModelUp — AI financial modeling",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "ModelUp — AI Financial Modeling for Founders",
    description: "AI-powered 5-year financial model + DCF valuation in 30 seconds.",
    images: ["/Logo_512.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <meta name="theme-color" content="#2563eb" />
      </head>
      <body className="bg-white text-gray-900 antialiased">
        {children}
        <FeedbackButton />
        <ChatWidget />

        {/* Google Analytics */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_ID}', { page_path: window.location.pathname });
          `}
        </Script>
      </body>
    </html>
  );
}
