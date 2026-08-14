import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface AIPanelProps {
  /** Header label — typically "AI Draft" or "AI Suggested". */
  label?: string;
  /** "thinking" shows a pulsing placeholder instead of content. */
  state?: "default" | "thinking";
  content?: React.ReactNode;
  onEdit?: () => void;
  onInsert?: () => void;
  onDiscard?: () => void;
  className?: string;
  children?: React.ReactNode;
}

export function AIPanel({
  label = "AI Draft",
  state = "default",
  content,
  onEdit,
  onInsert,
  onDiscard,
  className,
  children,
}: AIPanelProps) {
  const isThinking = state === "thinking";

  return (
    <div
      data-slot="ai-panel"
      data-state={state}
      className={cn(
        "flex flex-col rounded-md border border-l-4 border-border border-l-ai-accent bg-surface",
        className
      )}
    >
      <div className="flex items-center gap-1.5 border-b border-border px-3 py-2">
        <Sparkles className="size-3.5 shrink-0 text-ai-accent" aria-hidden="true" />
        <span className="text-xs font-medium text-ai-accent">{label}</span>
        {isThinking && <span className="text-xs text-neutral-600">Thinking…</span>}
      </div>

      <div className="px-3 py-3 text-sm text-neutral-950">
        {isThinking ? (
          <div className="flex flex-col gap-2" role="status" aria-live="polite" aria-label="AI is generating a response">
            <div className="h-3 w-11/12 animate-ai-pulse rounded-md bg-neutral-200" />
            <div className="h-3 w-full animate-ai-pulse rounded-md bg-neutral-200" />
            <div className="h-3 w-2/3 animate-ai-pulse rounded-md bg-neutral-200" />
          </div>
        ) : (
          content ?? children
        )}
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-border px-3 py-2">
        <Button variant="ghost" size="sm" onClick={onDiscard} disabled={isThinking}>
          Discard
        </Button>
        <Button variant="outline" size="sm" onClick={onEdit} disabled={isThinking}>
          Edit
        </Button>
        <Button variant="default" size="sm" onClick={onInsert} disabled={isThinking}>
          Insert
        </Button>
      </div>
    </div>
  );
}
