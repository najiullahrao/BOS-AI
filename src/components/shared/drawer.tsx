import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export interface DrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  side?: "left" | "right" | "top" | "bottom";
  footer?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

/**
 * Shared Drawer for forms and side panels. Built on shadcn Sheet — use this
 * instead of reaching for Sheet directly so every drawer stays consistent.
 */
export function Drawer({ open, onOpenChange, title, description, side = "right", footer, children, className }: DrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side={side} className={cn("flex flex-col gap-0 p-0", className)}>
        <SheetHeader className="border-b border-border">
          <SheetTitle>{title}</SheetTitle>
          {description && <SheetDescription>{description}</SheetDescription>}
        </SheetHeader>
        <div className="flex-1 overflow-y-auto p-4 text-sm text-neutral-950">{children}</div>
        {footer && <SheetFooter className="border-t border-border">{footer}</SheetFooter>}
      </SheetContent>
    </Sheet>
  );
}
