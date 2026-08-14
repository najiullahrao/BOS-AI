import { FilterX, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface EmptyStateBaseProps {
  icon?: LucideIcon;
  ctaLabel: string;
  onCtaClick?: () => void;
  className?: string;
}

export interface FirstTimeEmptyStateProps extends EmptyStateBaseProps {
  variant: "first-time";
  /** One encouraging sentence, e.g. "No tickets yet — they'll show up here once customers reach out, or create one manually." */
  message: string;
}

export interface FilteredEmptyStateProps extends EmptyStateBaseProps {
  variant: "filtered";
  /** One neutral sentence, e.g. "No results match your filters." */
  message?: string;
}

export type EmptyStateProps = FirstTimeEmptyStateProps | FilteredEmptyStateProps;

export function EmptyState(props: EmptyStateProps) {
  const { variant, ctaLabel, onCtaClick, className } = props;
  const isFirstTime = variant === "first-time";
  const message = props.message ?? (isFirstTime ? undefined : "No results match your filters.");
  const Icon = props.icon ?? (isFirstTime ? Inbox : FilterX);

  return (
    <div
      data-slot="empty-state"
      data-variant={variant}
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-md border border-dashed border-neutral-200 px-6 py-12 text-center",
        className
      )}
    >
      <div
        className={cn(
          "flex size-10 items-center justify-center rounded-full",
          isFirstTime ? "bg-primary/10 text-primary" : "bg-neutral-50 text-neutral-600"
        )}
      >
        <Icon className="size-5" aria-hidden="true" />
      </div>

      <p className={cn("max-w-sm text-sm", isFirstTime ? "text-neutral-950" : "text-neutral-600")}>
        {message}
      </p>

      <Button variant={isFirstTime ? "default" : "outline"} size="sm" onClick={onCtaClick}>
        {ctaLabel}
      </Button>
    </div>
  );
}
