import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StatusBadgeProps } from "@/components/shared/status-badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export interface KanbanCardData {
  id: string;
  title: string;
  description?: string;
  badge?: { label: string; variant: StatusBadgeProps["variant"] };
  meta?: React.ReactNode;
  /** Disables dragging for this card (e.g. permission-gated). Shows a not-allowed cursor and a reason tooltip on the handle instead of hiding it. */
  disabled?: boolean;
  disabledReason?: string;
}

export interface KanbanCardProps {
  card: KanbanCardData;
  dragHandleProps?: React.HTMLAttributes<HTMLElement>;
  isDragging?: boolean;
  onClick?: () => void;
  className?: string;
}

export function KanbanCard({ card, dragHandleProps, isDragging, onClick, className }: KanbanCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "flex flex-col gap-2 rounded-md border border-border bg-surface p-3 shadow-sm",
        onClick && "cursor-pointer",
        isDragging && "opacity-50",
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-neutral-950">{card.title}</p>
        {card.disabled ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="shrink-0 cursor-not-allowed touch-none text-neutral-200" aria-label="Dragging disabled">
                <GripVertical className="size-4" />
              </span>
            </TooltipTrigger>
            <TooltipContent>{card.disabledReason ?? "You can't move this card"}</TooltipContent>
          </Tooltip>
        ) : (
          <span
            {...dragHandleProps}
            className="shrink-0 cursor-grab touch-none text-neutral-200 hover:text-neutral-600 active:cursor-grabbing"
            aria-label="Drag to move card"
          >
            <GripVertical className="size-4" />
          </span>
        )}
      </div>

      {card.description && <p className="text-xs text-neutral-600">{card.description}</p>}

      <div className="flex items-center justify-between gap-2">
        {card.badge ? <StatusBadge variant={card.badge.variant}>{card.badge.label}</StatusBadge> : <span />}
        {card.meta}
      </div>
    </div>
  );
}
