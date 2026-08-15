"use client";

import { ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";

export default function AdminPortalPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Admin Portal" breadcrumbs={[{ label: "Home", href: "/dashboard" }, { label: "Admin Portal" }]} />
      <EmptyState
        variant="first-time"
        icon={ShieldCheck}
        message="Admin Portal — coming soon"
        ctaLabel="Back to Dashboard"
        onCtaClick={() => (window.location.href = "/dashboard")}
      />
    </div>
  );
}
