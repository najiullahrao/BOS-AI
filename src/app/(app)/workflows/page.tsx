"use client";

import { Workflow } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";

export default function WorkflowsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Workflows" breadcrumbs={[{ label: "Home", href: "/dashboard" }, { label: "Workflows" }]} />
      <EmptyState
        variant="first-time"
        icon={Workflow}
        message="Workflow Automation — coming soon"
        ctaLabel="Back to Dashboard"
        onCtaClick={() => (window.location.href = "/dashboard")}
      />
    </div>
  );
}
