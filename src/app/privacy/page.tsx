import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How ModelUp collects, uses, and protects your information when you build financial models on modelups.netlify.app.",
  alternates: { canonical: "/privacy" },
  robots: { index: true, follow: true },
};

const CONTACT_EMAIL = "finmodelup@gmail.com";
const APP_URL = "https://modelups.netlify.app";
const EFFECTIVE_DATE = "June 2, 2026";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-white text-gray-900">
      <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-6 py-3 flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/Logo_192.png" alt="ModelUp" width={28} height={28} className="rounded-lg" />
            <span className="text-gray-900 font-bold text-lg tracking-tight">
              Model<span className="text-blue-600">Up</span>
            </span>
          </Link>
          <Link
            href="/model/new"
            className="text-xs sm:text-sm font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-100 px-3 py-1.5 rounded-full transition-colors"
          >
            Build your model
          </Link>
        </div>
      </nav>

      <article className="max-w-3xl mx-auto px-6 py-12 pb-32 text-gray-700 leading-relaxed [&_h1]:text-3xl [&_h1]:font-extrabold [&_h1]:text-gray-900 [&_h1]:mb-2 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-gray-900 [&_h2]:mt-10 [&_h2]:mb-3 [&_p]:mb-4 [&_ul]:mb-4 [&_ul]:space-y-2 [&_ul]:list-disc [&_ul]:pl-6 [&_strong]:text-gray-900 [&_a]:text-blue-700 hover:[&_a]:underline">
        <h1>Privacy Policy</h1>
        <p>
          <strong>Effective date: {EFFECTIVE_DATE}</strong>
        </p>
        <p>
          This Privacy Policy explains how ModelUp (&ldquo;ModelUp,&rdquo; &ldquo;we,&rdquo;
          &ldquo;us,&rdquo; or &ldquo;our&rdquo;) collects, uses, and protects your information
          when you use the ModelUp application and website at{" "}
          <a href={APP_URL}>{APP_URL.replace(/^https?:\/\//, "")}</a> (the
          &ldquo;Service&rdquo;). By using the Service, you agree to the practices described
          here.
        </p>

        <h2>Information we collect</h2>
        <p>
          <strong>Usage data.</strong> We automatically collect limited technical information
          such as device type, browser, general usage activity, and log data to operate,
          secure, and improve the Service.
        </p>
        <p>
          <strong>Model inputs you provide.</strong> When you build a financial model you
          enter business information (e.g. business model, revenue, costs, headcount, raise).
          Models are saved primarily in your browser&apos;s local storage on your device. Some
          inputs are transmitted to our AI provider to generate suggestions, narratives, and
          chat responses (see &ldquo;AI-generated content&rdquo; below).
        </p>
        <p>
          <strong>Payment information.</strong> If you subscribe to a paid plan, payments are
          processed by our third-party payment processor, Stripe. We do not collect or store
          your full payment card details on our servers; that information is handled directly
          by Stripe under its own terms and privacy policy.
        </p>
        <p>
          <strong>Communication preferences.</strong> If you submit feedback or sign up for
          early access, we collect the email address you provide so we can reply or send the
          updates you request. You can opt out at any time by contacting us at{" "}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        </p>
        <p>
          <strong>Analytics data.</strong> We use Google Analytics to understand aggregate
          usage and improve the Service. Google Analytics may set cookies and collect
          identifiers such as IP address and device information.
        </p>

        <h2>How we use your information</h2>
        <p>
          We use the information we collect to provide and maintain the Service, generate
          your financial models, process payments for paid features, communicate with you
          about the Service, respond to your feedback, and analyze and improve features,
          performance, and security.
        </p>

        <h2>AI-generated content</h2>
        <p>
          ModelUp uses third-party artificial-intelligence services (Groq, running Llama
          family models) to suggest defaults from your business description, generate the
          investor-facing funding narrative, produce model insights, and power the in-app
          chat assistant. Inputs you provide for these features are transmitted to those
          providers solely to produce results for you. We do not use your inputs to train
          AI models.
        </p>

        <h2>How we share information</h2>
        <p>
          We do not sell your personal information. We share information only with service
          providers who help us operate the Service:
        </p>
        <ul>
          <li>
            <strong>Netlify</strong> — hosting and content delivery for the website.
          </li>
          <li>
            <strong>Stripe</strong> — payment processing for paid subscriptions.
          </li>
          <li>
            <strong>Groq</strong> — AI inference for suggestions, narratives, insights, and
            chat responses.
          </li>
          <li>
            <strong>Google Analytics</strong> — aggregate usage analytics.
          </li>
          <li>
            <strong>Resend</strong> — transactional email delivery for the feedback you send
            us.
          </li>
          <li>
            <strong>Supabase</strong> (when configured) — storage of feedback submissions and
            early-access sign-ups for an auditable record.
          </li>
        </ul>
        <p>
          Each provider processes data on our behalf under its own privacy and security
          obligations. We may also disclose information where required by law.
        </p>

        <h2>Data retention</h2>
        <p>
          Models you build are stored primarily in your browser&apos;s local storage; clearing
          your browser data deletes them. Feedback submissions and early-access sign-ups are
          retained for as long as needed to respond to you and improve the Service. Payment
          and subscription records are retained by Stripe and by us for as long as required
          for tax, legal, and accounting purposes.
        </p>

        <h2>Your rights</h2>
        <p>
          Depending on your location, you may have the right to access, correct, export, or
          delete your personal information, and to object to or restrict certain processing.
          To exercise these rights, contact us at{" "}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        </p>

        <h2>Security</h2>
        <p>
          We use reasonable technical and organizational measures to protect your
          information, including HTTPS for data in transit and access controls on our
          providers. No method of transmission or storage is completely secure, and we
          cannot guarantee absolute security.
        </p>

        <h2>Children&apos;s privacy</h2>
        <p>
          ModelUp is not directed to children under 13 (or the minimum age required in your
          jurisdiction), and we do not knowingly collect personal information from them. If
          you believe a child has provided us personal information, contact us and we will
          delete it.
        </p>

        <h2>International users</h2>
        <p>
          Your information may be processed and stored in countries other than your own,
          which may have different data-protection laws. By using the Service you consent to
          such processing.
        </p>

        <h2>Changes to this policy</h2>
        <p>
          We may update this Privacy Policy from time to time. Material changes will be
          posted on this page with a revised effective date.
        </p>

        <h2>Contact us</h2>
        <p>
          If you have questions about this Privacy Policy, contact us at{" "}
          <strong>
            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
          </strong>
          .
        </p>
      </article>
    </main>
  );
}
