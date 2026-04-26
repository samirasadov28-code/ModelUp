"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useState } from "react";
import { MessageSquarePlus, X, Star, Send, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Status = "idle" | "submitting" | "success" | "error";

export function FeedbackButton() {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState<number>(0);
  const [hovered, setHovered] = useState<number>(0);
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");

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
      {/* Floating trigger button */}
      <Dialog.Trigger asChild>
        <button
          className="fixed bottom-6 right-6 z-50 inline-flex items-center gap-2 bg-accent-500 hover:bg-accent-600 text-white text-sm font-medium px-4 py-2.5 rounded-full shadow-lg shadow-accent-500/30 transition-all hover:scale-105 active:scale-95"
          aria-label="Give feedback"
        >
          <MessageSquarePlus className="w-4 h-4" />
          <span className="hidden sm:inline">Feedback</span>
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        {/* Backdrop */}
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

        {/* Panel */}
        <Dialog.Content className="fixed bottom-20 right-6 z-50 w-full max-w-sm rounded-2xl border border-white/10 bg-navy-800 shadow-2xl p-6 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-bottom-4 data-[state=open]:slide-in-from-bottom-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <Dialog.Title className="text-white font-semibold">Share your feedback</Dialog.Title>
              <Dialog.Description className="text-white/40 text-xs mt-0.5">
                Takes 30 seconds. Helps us improve ModelUp.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button className="text-white/30 hover:text-white transition-colors rounded-lg p-1">
                <X className="w-4 h-4" />
              </button>
            </Dialog.Close>
          </div>

          {status === "success" ? (
            <div className="flex flex-col items-center justify-center py-6 gap-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-400" />
              <p className="text-white font-medium">Thank you!</p>
              <p className="text-white/40 text-sm text-center">Your feedback helps make ModelUp better.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Star rating */}
              <div>
                <p className="text-xs text-white/50 mb-2">How would you rate your experience?</p>
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
                            : "text-white/20"
                        )}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="text-xs text-white/50 mb-1.5 block">
                  What&apos;s on your mind? <span className="text-red-400">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Bug report, feature request, general thoughts…"
                  className="w-full rounded-lg border border-white/15 bg-navy-900/60 px-3 py-2 text-sm text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-accent-500 resize-none"
                />
              </div>

              {/* Email */}
              <div>
                <label className="text-xs text-white/50 mb-1.5 block">
                  Your email <span className="text-white/25">(optional — if you&apos;d like a reply)</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-lg border border-white/15 bg-navy-900/60 px-3 py-2 text-sm text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-accent-500"
                />
              </div>

              {status === "error" && (
                <p className="text-red-400 text-xs">Something went wrong. Please try again.</p>
              )}

              <button
                type="submit"
                disabled={status === "submitting" || !message.trim()}
                className="w-full inline-flex items-center justify-center gap-2 bg-accent-500 hover:bg-accent-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
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
