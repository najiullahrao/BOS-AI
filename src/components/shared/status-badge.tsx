import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const statusBadgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap",
  {
    variants: {
      variant: {
        success: "border-success/20 bg-success/10 text-success",
        warning: "border-warning/20 bg-warning/10 text-warning",
        danger: "border-danger/20 bg-danger/10 text-danger",
        info: "border-info/20 bg-info/10 text-info",
        neutral: "border-neutral-200 bg-neutral-50 text-neutral-600",
      },
      filled: {
        true: "",
        false: "",
      },
    },
    compoundVariants: [
      { variant: "success", filled: true, class: "border-transparent bg-success text-white" },
      { variant: "warning", filled: true, class: "border-transparent bg-warning text-white" },
      { variant: "danger", filled: true, class: "border-transparent bg-danger text-white" },
      { variant: "info", filled: true, class: "border-transparent bg-info text-white" },
      { variant: "neutral", filled: true, class: "border-transparent bg-neutral-600 text-white" },
    ],
    defaultVariants: {
      variant: "neutral",
      filled: false,
    },
  }
);

export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof statusBadgeVariants> {
  /** Show a small dot indicator before the label. */
  dot?: boolean;
}

export function StatusBadge({ className, variant, filled = false, dot = true, children, ...props }: StatusBadgeProps) {
  return (
    <span data-slot="status-badge" className={cn(statusBadgeVariants({ variant, filled }), className)} {...props}>
      {dot && (
        <span
          aria-hidden="true"
          className={cn("size-1.5 shrink-0 rounded-full", {
            "bg-white": filled,
            "bg-success": !filled && variant === "success",
            "bg-warning": !filled && variant === "warning",
            "bg-danger": !filled && variant === "danger",
            "bg-info": !filled && variant === "info",
            "bg-neutral-600": !filled && (variant === "neutral" || !variant),
          })}
        />
      )}
      {children}
    </span>
  );
}
