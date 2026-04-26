import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { FeedbackButton } from "@/components/FeedbackButton";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? "G-P2KEZWEVZ8";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://modelups.netlify.app";

export const metadata: Metadata = {
  title: {
    default: "ModelUp — Professional Financial Models for Startups",
    template: "%s — ModelUp",
  },
  description:
    "Answer 10 questions about your startup. Get a professional-grade financial model for fundraising in seconds.",
  keywords: [
    "startup financial model",
    "pitch deck financials",
    "fundraising model",
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
    title: "ModelUp — Professional Financial Models for Startups",
    description:
      "Answer 10 questions. Get a professional 3-year financial model for fundraising in seconds.",
    url: APP_URL,
    images: [
      {
        url: "/Logo_512.png",
        width: 512,
        height: 512,
        alt: "ModelUp",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "ModelUp — Financial Models for Startups",
    description: "Answer 10 questions. Get a professional 3-year financial model instantly.",
    images: ["/Logo_512.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <meta name="theme-color" content="#3B82F6" />
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
