const STORAGE_KEY = "modelup_early_access_email";

const BUILT_IN_EMAILS = ["samir.asadov.28@gmail.com"];

function getAllowlist(): Set<string> {
  const fromEnv = (process.env.NEXT_PUBLIC_EARLY_ACCESS_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return new Set([...BUILT_IN_EMAILS, ...fromEnv].map((e) => e.toLowerCase()));
}

function normalize(email: string): string {
  return email.trim().toLowerCase();
}

export function isEarlyAccessEmail(email: string): boolean {
  if (!email) return false;
  return getAllowlist().has(normalize(email));
}

export function hasEarlyAccess(): boolean {
  if (typeof window === "undefined") return false;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (!stored) return false;
  return isEarlyAccessEmail(stored);
}

export function grantEarlyAccess(email: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, normalize(email));
}

export function clearEarlyAccess(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}
