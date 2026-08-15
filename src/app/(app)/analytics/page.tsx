"use client";

import { BarChart3 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";

export default function AnalyticsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Analytics" breadcrumbs={[{ label: "Home", href: "/dashboard" }, { label: "Analytics" }]} />
      <EmptyState
        variant="first-time"
        icon={BarChart3}
        message="Analytics — coming soon"
        ctaLabel="Back to Dashboard"
        onCtaClick={() => (window.location.href = "/dashboard")}
      />
    </div>
  );
}
