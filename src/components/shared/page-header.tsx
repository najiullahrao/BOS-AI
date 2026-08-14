import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export interface Breadcrumb {
  label: string;
  href?: string;
}

export interface PageHeaderAction {
  label: string;
  onClick?: () => void;
  href?: string;
  icon?: LucideIcon;
  variant?: "default" | "outline" | "secondary" | "ghost" | "destructive";
}

export interface PageHeaderProps {
  title: string;
  breadcrumbs?: Breadcrumb[];
  primaryAction?: PageHeaderAction;
  className?: string;
  children?: React.ReactNode;
}

export function PageHeader({ title, breadcrumbs, primaryAction, className, children }: PageHeaderProps) {
  const ActionIcon = primaryAction?.icon;

  return (
    <div className={cn("flex flex-col gap-2 border-b border-border pb-4", className)}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1 text-xs text-neutral-600">
          {breadcrumbs.map((crumb, index) => {
            const isLast = index === breadcrumbs.length - 1;
            return (
              <span key={`${crumb.label}-${index}`} className={cn("flex min-w-0 items-center gap-1", isLast && "min-w-0")}>
                {crumb.href && !isLast ? (
                  <Link href={crumb.href} className="shrink-0 hover:text-neutral-950 hover:underline">
                    {crumb.label}
                  </Link>
                ) : (
                  <span
                    className={cn("truncate", isLast && "text-neutral-950 font-medium")}
                    title={isLast ? crumb.label : undefined}
                  >
                    {crumb.label}
                  </span>
                )}
                {!isLast && <ChevronRight className="size-3.5 shrink-0 text-neutral-200" aria-hidden="true" />}
              </span>
            );
          })}
        </nav>
      )}

      <div className="flex items-start justify-between gap-4">
        <h1 className="min-w-0 truncate text-xl font-semibold text-neutral-950 sm:text-2xl" title={title}>
          {title}
        </h1>

        <div className="flex shrink-0 items-center gap-2">
          {children}
          {primaryAction && (
            <Button
              variant={primaryAction.variant ?? "default"}
              onClick={primaryAction.onClick}
              asChild={Boolean(primaryAction.href)}
            >
              {primaryAction.href ? (
                <Link href={primaryAction.href}>
                  {ActionIcon && <ActionIcon />}
                  {primaryAction.label}
                </Link>
              ) : (
                <>
                  {ActionIcon && <ActionIcon />}
                  {primaryAction.label}
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
