"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, MonitorSmartphone, Users } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { DetailLayout } from "@/components/shared/detail-layout";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { toast } from "@/components/shared/toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { mockSession } from "@/lib/mock-data";
import { ROLE_LABELS } from "@/lib/mock-team";
import { formatDateTime } from "@/lib/mock-sessions";
import { auditActionLabel, auditEntityTypeLabel } from "@/lib/mock-audit-log";
import { useImpersonation } from "@/lib/impersonation-context";
import {
  ORG_PLAN_BADGE,
  ORG_STATUS_BADGE,
  ORG_USAGE_STATS,
  getOrgMembers,
  getRecentAuditLog,
  type AdminOrgMember,
} from "@/lib/mock-admin";
import { useAdminOrgs } from "@/lib/use-mock-admin";

function StatRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-border py-2 last:border-0">
      <span className="text-sm text-neutral-600">{label}</span>
      <span className="text-sm font-medium text-neutral-950">{value}</span>
    </div>
  );
}

export default function AdminOrgDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params.id);
  const { orgs } = useAdminOrgs();
  const org = orgs.find((o) => o.id === id);
  const { startImpersonation } = useImpersonation();
  const [activeTab, setActiveTab] = useState("overview");

  if (!org) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Organization not found"
          breadcrumbs={[
            { label: "Home", href: "/dashboard" },
            { label: "Admin Portal", href: "/admin" },
            { label: "Organizations", href: "/admin/organizations" },
            { label: "Not found" },
          ]}
        />
        <EmptyState
          variant="first-time"
          message="This organization could not be found."
          ctaLabel="Back to organizations"
          onCtaClick={() => router.push("/admin/organizations")}
        />
      </div>
    );
  }

  const usage = ORG_USAGE_STATS[id];
  const members = getOrgMembers(id);
  const recentAudit = getRecentAuditLog();

  function handleViewAsOrg() {
    const member = members.find((m) => m.id !== mockSession.user.id) ?? members[0];
    if (!member) {
      toast.error("No members available to impersonate");
      return;
    }
    startImpersonation({
      userId: member.id,
      userName: member.name,
      userEmail: member.email,
      orgName: org!.name,
    });
    toast.success(`Now viewing as ${member.name} at ${org!.name}`);
  }

  const memberColumns: DataTableColumn<AdminOrgMember>[] = [
    {
      key: "name",
      header: "Name",
      filterPlaceholder: "Search members…",
      accessor: (m) => <span className="font-medium text-neutral-950">{m.name}</span>,
    },
    {
      key: "email",
      header: "Email",
      accessor: (m) => <span className="text-neutral-600">{m.email}</span>,
    },
    {
      key: "role",
      header: "Role",
      accessor: (m) => <span className="text-neutral-950">{ROLE_LABELS[m.role as keyof typeof ROLE_LABELS] ?? m.role}</span>,
    },
    {
      key: "status",
      header: "Status",
      accessor: (m) => (
        <StatusBadge variant={m.status === "active" ? "success" : "danger"}>{m.status}</StatusBadge>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={org.name}
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Admin Portal", href: "/admin" },
          { label: "Organizations", href: "/admin/organizations" },
          { label: org.name },
        ]}
        primaryAction={{ label: "View as organization", icon: MonitorSmartphone, onClick: handleViewAsOrg }}
      >
        <Button variant="outline" onClick={() => router.push("/admin/organizations")}>
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          Back
        </Button>
      </PageHeader>

      <DetailLayout
        header={
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge variant={ORG_STATUS_BADGE[org.status]}>
                {org.status === "deleted_pending_purge" ? "deleted" : org.status}
              </StatusBadge>
              <StatusBadge variant={ORG_PLAN_BADGE[org.plan]} dot={false}>
                {org.plan}
              </StatusBadge>
              <span className="font-mono text-xs text-neutral-600">{org.id}</span>
            </div>
            <p className="text-sm text-neutral-600">
              Created {org.createdAt} · {org.seatCount} seat{org.seatCount === 1 ? "" : "s"}
            </p>
          </div>
        }
        tabs={[
          {
            value: "overview",
            label: "Overview",
            content: (
              <Card>
                <CardHeader>
                  <CardTitle>Usage stats</CardTitle>
                  <CardDescription>Current usage for this organization.</CardDescription>
                </CardHeader>
                <CardContent>
                  {usage ? (
                    <div className="flex flex-col">
                      <StatRow label="Seats" value={usage.seats} />
                      <StatRow label="AI runs" value={usage.aiRuns.toLocaleString()} />
                      <StatRow label="Workflow runs" value={usage.workflowRuns.toLocaleString()} />
                      <StatRow label="KB storage" value={usage.kbStorage} />
                    </div>
                  ) : (
                    <p className="text-sm text-neutral-600">No usage data available for this organization.</p>
                  )}
                </CardContent>
              </Card>
            ),
          },
          {
            value: "members",
            label: `Members (${members.length})`,
            content: (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 text-sm text-neutral-600">
                  <Users className="size-4" aria-hidden="true" />
                  Read-only member roster. Use the Team screen within the org to manage roles.
                </div>
                <DataTable
                  columns={memberColumns}
                  data={members}
                  getRowId={(m) => m.id}
                  filters={{}}
                  onFilterChange={() => {}}
                  hasMore={false}
                />
              </div>
            ),
          },
          {
            value: "activity",
            label: "Recent activity",
            content: (
              <Card>
                <CardHeader>
                  <CardTitle>Recent activity</CardTitle>
                  <CardDescription>Most recent platform audit events.</CardDescription>
                </CardHeader>
                <CardContent>
                  <ol className="flex flex-col divide-y divide-border">
                    {recentAudit.map((entry) => (
                      <li key={entry.id} className="flex flex-col gap-1 py-2.5">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm font-medium text-neutral-950">
                            {auditActionLabel(entry.action)}
                          </span>
                          <span className="text-xs text-neutral-600">{formatDateTime(entry.createdAt)}</span>
                        </div>
                        <span className="text-xs text-neutral-600">
                          {entry.actor ?? entry.systemLabel ?? "System"} · {auditEntityTypeLabel(entry.entityType)}
                        </span>
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>
            ),
          },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
    </div>
  );
}