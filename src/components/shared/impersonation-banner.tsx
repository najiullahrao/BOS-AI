"use client";

import { Timer, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { impersonationCountdownLabel, useImpersonation } from "@/lib/impersonation-context";

export function ImpersonationBanner() {
  const { target, remainingSeconds, endImpersonation } = useImpersonation();
  if (!target) return null;

  return (
    <div className="flex items-center gap-3 border-b border-warning/40 bg-warning/15 px-4 py-2 text-sm text-neutral-950">
      <Timer className="size-4 shrink-0 text-warning" aria-hidden="true" />
      <span className="flex-1">
        Impersonating <strong className="font-semibold">{target.userName}</strong> ({target.userEmail}) at {target.orgName}
      </span>
      <span className="font-mono font-semibold text-warning" aria-label="Time remaining">
        {impersonationCountdownLabel(remainingSeconds)}
      </span>
      <Button variant="outline" size="sm" onClick={endImpersonation}>
        <X className="size-3.5" aria-hidden="true" />
        Exit impersonation
      </Button>
    </div>
  );
}