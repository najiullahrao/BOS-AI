"use client";

import Link from "next/link";
import { FileText } from "lucide-react";
import { Popover as PopoverPrimitive } from "radix-ui";
import { cn } from "@/lib/utils";
import type { ChatSource } from "@/app/(app)/ai-chat/mock-chat";

interface SourceChipProps {
  source?: ChatSource;
  index: number;
  accent?: "ai" | "brand";
}

/** Splits "text [1] more [2]" into text segments and citation indexes. */
export function splitCitationText(content: string): ({ type: "text"; text: string } | { type: "cite"; index: number })[] {
  const parts = content.split(/(\[\d+\])/g);
  const segments: ({ type: "text"; text: string } | { type: "cite"; index: number })[] = [];
  for (const part of parts) {
    const match = part.match(/^\[(\d+)\]$/);
    if (match) {
      segments.push({ type: "cite", index: Number(match[1]) - 1 });
    } else {
      segments.push({ type: "text", text: part });
    }
  }
  return segments;
}

/**
 * Numbered citation chip ([1], [2]) rendered inline in assistant answer text.
 * Clicking opens a small popover with the KB document title and a link to it.
 */
export function SourceChip({ source, index, accent = "ai" }: SourceChipProps) {
  if (!source) {
    return <span className="font-medium text-neutral-600">[{index + 1}]</span>;
  }

  return (
    <PopoverPrimitive.Root>
      <PopoverPrimitive.Trigger asChild>
        <button
          type="button"
          aria-label={`Open source ${index + 1}: ${source.title}`}
          className={cn(
            "mx-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full align-baseline text-[10px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
            accent === "ai"
              ? "border border-ai-accent/30 bg-ai-accent/10 text-ai-accent hover:bg-ai-accent/20"
              : "border border-info/30 bg-info/10 text-info hover:bg-info/20"
          )}
        >
          {index + 1}
        </button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          side="top"
          align="start"
          sideOffset={6}
          className="z-50 w-64 rounded-md border border-border bg-surface p-3 shadow-md outline-none data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95"
        >
          <div className="flex items-center gap-1.5">
            <FileText className="size-3.5 text-neutral-600" aria-hidden="true" />
            <span className="text-xs font-medium text-neutral-600">Source {index + 1}</span>
          </div>
          <Link
            href={`/knowledge-base/${source.id}`}
            className="mt-1 block text-sm font-medium text-primary hover:underline"
          >
            {source.title}
          </Link>
          <div className="mt-2 border-t border-border pt-2">
            <Link
              href={`/knowledge-base/${source.id}`}
              className="text-xs text-neutral-600 hover:text-neutral-950 hover:underline"
            >
              View in knowledge base
            </Link>
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
