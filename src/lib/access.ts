/**
 * Master switch for the Pro paywall.
 *
 * When `true` (current default during early access), the `/model/[id]/full`
 * page is unlocked for everyone, the Stripe checkout CTAs are replaced with
 * direct "Open full model" links, and pricing copy explains the temporary
 * free access. **All Stripe / Supabase / webhook code is left intact** — flip
 * this constant back to `false` to reinstate paid subscriptions without any
 * other code changes.
 *
 * Future paid relaunch checklist:
 *   1. Set EARLY_ACCESS_FREE_FOR_ALL = false here.
 *   2. (Optional) set NEXT_PUBLIC_GATE_ENABLED=true on Netlify if you also
 *      want the historical email-allowlist gate enabled.
 *   3. Redeploy.
 */
export const EARLY_ACCESS_FREE_FOR_ALL = true;
