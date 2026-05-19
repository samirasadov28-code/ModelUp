"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { MessageSquarePlus, X, Star, Send, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Status = "idle" | "submitting" | "success" | "error";

export function FeedbackButton() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState<number>(0);
  const [hovered, setHovered] = useState<number>(0);
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  // The questionnaire renders a sticky bottom action bar — lift the floating
  // button above it so the two never overlap.
  const hasStickyBottomBar = pathname === "/model/new";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;
    setStatus("submitting");

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: message.trim(),
          email: email.trim() || null,
          rating: rating || null,
          page_url: window.location.pathname,
        }),
      });
      if (!res.ok) throw new Error();
      setStatus("success");
      setTimeout(() => {
        setOpen(false);
        setStatus("idle");
        setMessage("");
        setEmail("");
        setRating(0);
      }, 2000);
    } catch {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          className={cn(
            "fixed left-6 z-50 inline-flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 text-sm font-semibold px-4 py-2.5 rounded-full shadow-lg border border-gray-200 transition-all hover:scale-105 active:scale-95",
            hasStickyBottomBar ? "bottom-20" : "bottom-6"
          )}
          aria-label="Give feedback"
        >
          <MessageSquarePlus className="w-4 h-4" />
          <span className="hidden sm:inline">Feedback</span>
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[55] bg-gray-900/30 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

        <Dialog.Content className="fixed bottom-20 left-4 right-4 sm:bottom-20 sm:left-6 sm:right-auto z-[55] w-auto sm:w-[360px] max-w-sm rounded-2xl border border-gray-200 bg-white shadow-2xl p-6 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-bottom-4 data-[state=open]:slide-in-from-bottom-4">
          <div className="flex items-center justify-between mb-5">
            <div>
              <Dialog.Title className="text-gray-900 font-semibold">Share your feedback</Dialog.Title>
              <Dialog.Description className="text-gray-500 text-xs mt-0.5">
                Takes 30 seconds. Helps us improve ModelUp.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button className="text-gray-400 hover:text-gray-700 transition-colors rounded-lg p-1">
                <X className="w-4 h-4" />
              </button>
            </Dialog.Close>
          </div>

          {status === "success" ? (
            <div className="flex flex-col items-center justify-center py-6 gap-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-500" />
              <p className="text-gray-900 font-semibold">Thank you!</p>
              <p className="text-gray-500 text-sm text-center">Your feedback helps make ModelUp better.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <p className="text-xs text-gray-600 mb-2 font-medium">How would you rate your experience?</p>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHovered(star)}
                      onMouseLeave={() => setHovered(0)}
                      className="p-0.5 transition-transform hover:scale-110"
                    >
                      <Star
                        className={cn(
                          "w-6 h-6 transition-colors",
                          star <= (hovered || rating)
                            ? "fill-amber-400 text-amber-400"
                            : "text-gray-300"
                        )}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-600 mb-1.5 block font-medium">
                  What&apos;s on your mind? <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Bug report, feature request, general thoughts…"
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 resize-none"
                />
              </div>

              <div>
                <label className="text-xs text-gray-600 mb-1.5 block font-medium">
                  Your email <span className="text-gray-400">(optional — if you&apos;d like a reply)</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400"
                />
              </div>

              {status === "error" && (
                <p className="text-red-600 text-xs">Something went wrong. Please try again.</p>
              )}

              <button
                type="submit"
                disabled={status === "submitting" || !message.trim()}
                className="w-full inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
              >
                {status === "submitting" ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                {status === "submitting" ? "Sending…" : "Send feedback"}
              </button>
            </form>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
