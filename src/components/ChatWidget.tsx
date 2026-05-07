"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { usePathname } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { MessageCircle, Send, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { getModelLocally } from "@/lib/model-client-store";
import type { ModelOutputs } from "@/lib/types";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const MODEL_PROMPTS = [
  "What's my biggest financial risk?",
  "Is my LTV/CAC ratio healthy?",
  "What if I doubled my CAC — how does runway change?",
  "Explain my Year-3 EBITDA in plain English.",
];

const GENERAL_PROMPTS = [
  "What does ModelUp do?",
  "What's the difference between Free and Pro?",
  "How do I think about CAC vs LTV?",
  "How do investors evaluate my runway?",
];

function extractModelIdFromPath(pathname: string | null): string | null {
  if (!pathname) return null;
  const match = pathname.match(/^\/model\/([^/]+)\//);
  return match ? match[1] : null;
}

export function ChatWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeModel, setActiveModel] = useState<ModelOutputs | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load the active model from localStorage when on a /model/[id]/* route
  useEffect(() => {
    const id = extractModelIdFromPath(pathname);
    if (!id) {
      setActiveModel(null);
      return;
    }
    const m = getModelLocally(id);
    setActiveModel(m ?? null);
  }, [pathname]);

  // Reset thread when the active model changes (so context doesn't bleed)
  useEffect(() => {
    setMessages([]);
    setError(null);
  }, [activeModel?.modelId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, pending]);

  const suggestions = useMemo(
    () => (activeModel ? MODEL_PROMPTS : GENERAL_PROMPTS),
    [activeModel]
  );

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || pending) return;

    const next = [...messages, { role: "user" as const, content: trimmed }];
    setMessages(next);
    setInput("");
    setPending(true);
    setError(null);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: activeModel ?? undefined,
          messages: next,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Chat request failed");
      setMessages([...next, { role: "assistant", content: data.reply }]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Chat request failed";
      setError(msg);
    } finally {
      setPending(false);
    }
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    send(input);
  };

  const headerLabel = activeModel
    ? `Ask about ${activeModel.answers.companyName ?? "your model"}`
    : "Ask the ModelUp assistant";

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          className="fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-full shadow-lg shadow-blue-500/30 transition-all hover:scale-105 active:scale-95"
          aria-label="Chat with the ModelUp assistant"
        >
          <MessageCircle className="w-4 h-4" />
          <span className="hidden sm:inline">{activeModel ? "Ask the model" : "Chat"}</span>
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-gray-900/30 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

        <Dialog.Content className="fixed bottom-4 left-4 right-4 sm:bottom-6 sm:right-6 sm:left-auto z-50 w-auto sm:w-[420px] max-h-[85vh] flex flex-col rounded-2xl border border-gray-200 bg-white shadow-2xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-bottom-4 data-[state=open]:slide-in-from-bottom-4">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2 min-w-0">
              <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
              <div className="min-w-0">
                <Dialog.Title className="text-gray-900 font-semibold text-sm truncate">
                  {headerLabel}
                </Dialog.Title>
                <Dialog.Description className="text-gray-500 text-xs mt-0.5">
                  Powered by Groq
                  {activeModel ? " · uses your actual numbers" : " · Llama 3.3 70B"}
                </Dialog.Description>
              </div>
            </div>
            <Dialog.Close asChild>
              <button className="text-gray-400 hover:text-gray-700 transition-colors rounded-lg p-1">
                <X className="w-4 h-4" />
              </button>
            </Dialog.Close>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-4 min-h-[280px]">
            {messages.length === 0 && (
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  {activeModel
                    ? "I'm looking at your model now. Ask anything — runway, scenarios, what investors will push back on, what to fix first."
                    : "Hi! I can help you understand ModelUp or answer general financial-modelling questions. Build a model first and I'll be able to reason about your specific numbers."}
                </p>
                <div className="space-y-2">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => send(s)}
                      disabled={pending}
                      className="w-full text-left text-xs text-gray-700 bg-blue-50 hover:bg-blue-100 border border-blue-100 rounded-lg px-3 py-2 transition-colors disabled:opacity-50"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div
                key={i}
                className={cn(
                  "rounded-xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap max-w-[88%]",
                  m.role === "user"
                    ? "bg-blue-600 text-white ml-auto"
                    : "bg-gray-100 text-gray-900"
                )}
              >
                {m.content}
              </div>
            ))}

            {pending && (
              <div className="bg-gray-100 text-gray-500 rounded-xl px-3.5 py-2.5 text-sm max-w-[88%] inline-flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-pulse" />
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-pulse [animation-delay:120ms]" />
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-pulse [animation-delay:240ms]" />
              </div>
            )}

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 text-red-700 text-xs px-3 py-2">
                {error}
              </div>
            )}
          </div>

          <form onSubmit={onSubmit} className="border-t border-gray-100 p-3 flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={activeModel ? "Ask about your model…" : "Ask anything about ModelUp…"}
              disabled={pending}
              className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={pending || !input.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white p-2.5 rounded-lg transition-colors"
              aria-label="Send"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
