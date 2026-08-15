"use client";

import { useEffect, useRef, useState } from "react";

const REVEAL_INTERVAL_MS = 16;
const CHARS_PER_STEP = 2;

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Reveals `text` token-by-token to simulate an LLM stream. When `stream` is
 * false (historical messages) or the user prefers reduced motion, the full
 * text is returned immediately.
 *
 * All state updates happen inside the interval callback so the effect body
 * stays side-effect free (no synchronous setState).
 */
export function useStreamingText(text: string, stream: boolean): string {
  const reduced = prefersReducedMotion();
  const shouldStream = stream && !reduced;
  const [count, setCount] = useState(0);
  const targetRef = useRef<string | null>(null);

  useEffect(() => {
    if (!shouldStream || text.length === 0) return;

    const interval = window.setInterval(() => {
      setCount((current) => {
        if (targetRef.current !== text) {
          targetRef.current = text;
          return Math.min(text.length, CHARS_PER_STEP);
        }
        if (current >= text.length) {
          window.clearInterval(interval);
          return current;
        }
        return Math.min(text.length, current + CHARS_PER_STEP);
      });
    }, REVEAL_INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, [text, shouldStream]);

  if (!shouldStream) return text;
  return text.slice(0, count);
}
