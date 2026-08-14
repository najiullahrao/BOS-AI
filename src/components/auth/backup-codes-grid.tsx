"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface BackupCodesGridProps {
  codes: string[];
}

export function BackupCodesGrid({ codes }: BackupCodesGridProps) {
  function handleDownload() {
    const blob = new Blob([codes.join("\n") + "\n"], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "ai-bos-backup-codes.txt";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-2 rounded-md border border-border bg-neutral-50 p-3">
        {codes.map((code) => (
          <span key={code} className="font-mono text-sm text-neutral-950">
            {code}
          </span>
        ))}
      </div>
      <Button type="button" variant="outline" onClick={handleDownload}>
        <Download className="size-4" />
        Download backup codes
      </Button>
      <p className="text-xs text-neutral-600">
        Store these somewhere safe. Each code can be used once if you lose access to your authenticator app.
      </p>
    </div>
  );
}
