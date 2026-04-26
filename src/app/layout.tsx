import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { FeedbackButton } from "@/components/FeedbackButton";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? "G-P2KEZWEVZ8";

export const metadata: Metadata = {
  title: {
    default: "ModelUp — Professional Financial Models for Startups",
    template: "%s — ModelUp",
  },
  description:
    "Answer 10 questions about your startup. Get a professional-grade financial model for fundraising in seconds.",
  keywords: ["startup financial model", "pitch deck financials", "fundraising model", "SaaS financial projections"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="bg-navy-900 text-white antialiased">
        {children}
        <FeedbackButton />

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
