/**
 * Master switch for the Pro paywall.
 *
 * When `true` (current default during early access), the `/model/[id]/full`
 * page is unlocked for everyone, the Stripe checkout CTAs are replaced with
 * direct "Open full model" links, and pricing copy explains the temporary
 * free access. **All Stripe / Supabase / webhook code is left intact** — set
 * `NEXT_PUBLIC_EARLY_ACCESS_FREE_FOR_ALL=false` (build-time env) to reinstate the paid
 * paywall without any other code changes.
 *
 * Paid go-live checklist (needs Sam's approval):
 *   1. Apply supabase/migration_pro_purchases.sql to the production Supabase project.
 *   2. Create the live $4.99 one-off price + live webhook endpoint in Stripe
 *      (events: checkout.session.completed, checkout.session.async_payment_succeeded,
 *      charge.refunded, charge.dispute.created) and set the live env vars.
 *   3. Set NEXT_PUBLIC_EARLY_ACCESS_FREE_FOR_ALL=false on Netlify and redeploy.
 */
export const EARLY_ACCESS_FREE_FOR_ALL = process.env.NEXT_PUBLIC_EARLY_ACCESS_FREE_FOR_ALL !== "false";
