import type { Metadata } from "next";

// Per-model pages contain user-specific data that doesn't belong in search
// indices. Tell crawlers to skip them, but still allow them to be opened
// directly via shared links.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function ModelInstanceLayout({ children }: { children: React.ReactNode }) {
  return children;
}
