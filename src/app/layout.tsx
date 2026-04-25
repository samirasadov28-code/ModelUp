import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "ModelUp — Professional Financial Models for Startups",
    template: "%s — ModelUp",
  },
  description:
    "Answer 10 questions about your startup. Get a professional-grade financial model for fundraising in seconds.",
  keywords: ["startup financial model", "pitch deck financials", "fundraising model", "SaaS financial projections"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="bg-navy-900 text-white antialiased">{children}</body>
    </html>
  );
}
