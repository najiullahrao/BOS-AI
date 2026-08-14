import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BrandMarkProps {
  size?: "sm" | "md";
  className?: string;
}

export function BrandMark({ size = "sm", className }: BrandMarkProps) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-md bg-primary text-white",
        size === "sm" ? "size-7" : "size-9",
        className
      )}
    >
      <Sparkles className={size === "sm" ? "size-4" : "size-5"} aria-hidden="true" />
    </div>
  );
}
