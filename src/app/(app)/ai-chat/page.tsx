"use client";

import { Bot } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";

export default function AiChatPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="AI Chat" breadcrumbs={[{ label: "Home", href: "/dashboard" }, { label: "AI Chat" }]} />
      <EmptyState
        variant="first-time"
        icon={Bot}
        message="AI Chat — coming soon"
        ctaLabel="Back to Dashboard"
        onCtaClick={() => (window.location.href = "/dashboard")}
      />
    </div>
  );
}
