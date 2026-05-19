"use client";

import { useEffect, useLayoutEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { ArrowRight, X } from "lucide-react";

interface TourStep {
  /** CSS selector for the anchor element. The coachmark positions itself below it. */
  target: string;
  title: string;
  body: string;
  /** Optional click handler — e.g. switch tabs before showing the next step. */
  beforeShow?: () => void;
}

interface TourRunnerProps {
  steps: TourStep[];
  storageKey: string;
  nextLabel: string;
  doneLabel: string;
  skipLabel: string;
  stepLabel: string;
}

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

function useAnchorRect(selector: string, index: number): Rect | null {
  const [rect, setRect] = useState<Rect | null>(null);

  useLayoutEffect(() => {
    let frame = 0;
    const measure = () => {
      const el = document.querySelector(selector) as HTMLElement | null;
      if (!el) {
        setRect(null);
        return;
      }
      const r = el.getBoundingClientRect();
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    };
    measure();
    // Re-measure after layout settles (tab change animations, font load).
    frame = requestAnimationFrame(measure);
    const onResize = () => measure();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
    };
  }, [selector, index]);

  return rect;
}

export function TourRunner({
  steps,
  storageKey,
  nextLabel,
  doneLabel,
  skipLabel,
  stepLabel,
}: TourRunnerProps) {
  const [mounted, setMounted] = useState(false);
  const [index, setIndex] = useState(0);
  const [active, setActive] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      if (typeof window === "undefined") return;
      const seen = window.localStorage.getItem(storageKey);
      if (!seen) {
        // Slight delay so the page has time to render tabs etc.
        const t = setTimeout(() => setActive(true), 600);
        return () => clearTimeout(t);
      }
    } catch {
      /* ignore */
    }
  }, [storageKey]);

  useEffect(() => {
    if (!active) return;
    const step = steps[index];
    step?.beforeShow?.();
  }, [active, index, steps]);

  const rect = useAnchorRect(steps[index]?.target ?? "", index);

  const finish = () => {
    setActive(false);
    try {
      window.localStorage.setItem(storageKey, "1");
    } catch {
      /* ignore */
    }
  };

  if (!mounted || !active || !rect) return null;
  const step = steps[index];
  if (!step) return null;

  const POPOVER_WIDTH = 320;
  const GAP = 12;

  // Position below the anchor, horizontally centred — clamp inside viewport.
  let left = rect.left + rect.width / 2 - POPOVER_WIDTH / 2;
  left = Math.max(12, Math.min(window.innerWidth - POPOVER_WIDTH - 12, left));
  let top = rect.top + rect.height + GAP;
  // If we'd go off the bottom of the screen, render above the anchor instead.
  const ESTIMATED_HEIGHT = 170;
  if (top + ESTIMATED_HEIGHT > window.innerHeight) {
    top = Math.max(12, rect.top - ESTIMATED_HEIGHT - GAP);
  }

  const isLast = index === steps.length - 1;

  return createPortal(
    <div className="fixed inset-0 z-[60] pointer-events-none">
      {/* Soft overlay (clickable through except on the popover) */}
      <div className="absolute inset-0 bg-gray-900/20 backdrop-blur-[1px]" />
      {/* Highlight ring around the anchor */}
      <div
        className="absolute rounded-lg ring-4 ring-blue-400 ring-offset-2 ring-offset-white/60 transition-all duration-200"
        style={{
          top: rect.top - 4,
          left: rect.left - 4,
          width: rect.width + 8,
          height: rect.height + 8,
        }}
      />
      {/* Popover */}
      <div
        className="absolute pointer-events-auto rounded-2xl border border-blue-200 bg-white shadow-2xl shadow-blue-500/20 p-4"
        style={{ top, left, width: POPOVER_WIDTH }}
        role="dialog"
        aria-labelledby="coachmark-title"
      >
        <div className="flex items-start justify-between gap-3 mb-1">
          <p id="coachmark-title" className="text-sm font-bold text-gray-900">
            {step.title}
          </p>
          <button
            type="button"
            onClick={finish}
            className="text-gray-400 hover:text-gray-700 transition-colors -mr-1 -mt-1 p-1"
            aria-label={skipLabel}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        <p className="text-xs text-gray-600 leading-relaxed">{step.body}</p>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-400">
            {stepLabel.replace("{current}", String(index + 1)).replace("{total}", String(steps.length))}
          </span>
          <div className="flex items-center gap-2">
            {!isLast && (
              <button
                type="button"
                onClick={finish}
                className="text-xs font-semibold text-gray-500 hover:text-gray-700 px-2 py-1"
              >
                {skipLabel}
              </button>
            )}
            <button
              type="button"
              onClick={() => (isLast ? finish() : setIndex(index + 1))}
              className="inline-flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
            >
              {isLast ? doneLabel : nextLabel}
              {!isLast && <ArrowRight className="w-3 h-3" />}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

/** Helper to mark a target. Keeps the data attribute name consistent across the codebase. */
export function tourTarget(id: string): { "data-tour": string } {
  return { "data-tour": id };
}

/** Decorative wrapper — children renders normally, we just expose the data-tour attr. */
export function TourTarget({ id, children }: { id: string; children: ReactNode }) {
  return <span data-tour={id}>{children}</span>;
}
