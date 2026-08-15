"use client";

import { useState } from "react";
import { Switch } from "radix-ui";
import { PageHeader } from "@/components/shared/page-header";
import { InternalChat } from "@/app/(app)/ai-chat/internal-chat";
import { CustomerWidget } from "@/app/(app)/ai-chat/customer-widget";

export default function AiChatPage() {
  const [showWidget, setShowWidget] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="AI Chat" breadcrumbs={[{ label: "Home", href: "/dashboard" }, { label: "AI Chat" }]}>
        <label className="flex cursor-pointer select-none items-center gap-2 text-sm text-neutral-600">
          <Switch.Root
            checked={showWidget}
            onCheckedChange={setShowWidget}
            aria-label="Preview customer widget"
            className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent bg-neutral-200 transition-colors data-checked:bg-info"
          >
            <Switch.Thumb className="pointer-events-none block size-4 rounded-full bg-surface shadow-sm transition-transform data-checked:translate-x-4" />
          </Switch.Root>
          Preview customer widget
        </label>
      </PageHeader>

      <InternalChat />
      {showWidget && <CustomerWidget />}
    </div>
  );
}
