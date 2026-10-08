import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service - ModelUp",
  description: "ModelUp Terms of Service.",
  alternates: { canonical: "/terms" },
};

const CSS = "body{margin:0;background:#f8fafc;color:#1e293b;font:16px/1.65 system-ui,-apple-system,Segoe UI,Roboto,sans-serif}main{max-width:680px;margin:0 auto;padding:40px 22px 64px}h1{font-size:28px;margin:0 0 6px}h2{font-size:17px;margin:28px 0 6px}p{margin:0}a{color:#2563eb}.f{margin-top:36px;font-size:13px;opacity:.75}";
const BODY = "<p><a href=\"/\">&larr; ModelUp</a></p><h1>Terms of Service</h1><h2>1. Service</h2><p>ModelUp (modelups.netlify.app) is a personal project operated by Samir Asadov as an individual (&quot;we&quot;). It provides AI-assisted startup financial models.</p><h2>2. Estimates, not advice</h2><p>All outputs, including AI-generated analysis, figures, projections and stories, are estimates for information only. They are not financial, investment, tax, legal or professional advice, and not a solicitation to buy or sell anything. Verify important decisions with a qualified professional. Models may be shared with investors at your own risk. We do not warrant investor outcomes.</p><h2>3. Accounts and access</h2><p>A 5-year P&amp;L preview is free. Pro is a one-off payment of USD 4.99 for lifetime access (currently free during early access). Prices may change with notice on the site; changes do not affect purchases already made.</p><h2>4. Payments and refunds</h2><p>Payments are processed by Stripe. If a paid feature fails to deliver, contact finmodeloop@gmail.com within 14 days for redelivery or refund.</p><h2>5. Acceptable use</h2><p>Do not misuse the service, probe its systems, or resell outputs as your own professional advice.</p><h2>6. Intellectual property</h2><p>The site, branding and generated report formats are ours. Your inputs stay yours.</p><h2>7. Availability</h2><p>The service is provided &quot;as is&quot; with no uptime guarantee. We may change or withdraw features with notice on the site.</p><h2>8. Liability</h2><p>To the maximum extent permitted by law, we are not liable for indirect losses or for decisions made using the service&#x27;s estimates. Nothing excludes liability that cannot be excluded by law.</p><h2>9. Privacy</h2><p>Personal data handling is described in the <a href=\"/privacy\">Privacy Policy</a>.</p><h2>10. Contact</h2><p><a href=\"mailto:finmodeloop@gmail.com\">finmodeloop@gmail.com</a>. Governing law: Ireland. Effective date: 8 October 2026.</p>\n<p class=\"f\">Estimates and AI-generated content are for information only and are not financial, investment, legal or professional advice.</p>";

export default function TermsPage() {
  return (
    <div>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <main dangerouslySetInnerHTML={{ __html: BODY }} />
    </div>
  );
}
