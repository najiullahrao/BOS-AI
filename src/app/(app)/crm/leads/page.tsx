"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type DataTableColumn, type DataTableSort } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge, type StatusBadgeProps } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/shared/toast";
import { cn } from "@/lib/utils";
import { mockSession } from "@/lib/mock-data";
import { ConvertLeadModal } from "@/app/(app)/crm/leads/convert-lead-modal";
import { mockLeads, SOURCE_LABELS, type Lead, type LeadStatus } from "@/lib/mock-crm";

const LEAD_STATUSES: LeadStatus[] = ["new", "contacted", "qualified", "unqualified", "converted"];

const STATUS_LABELS: Record<LeadStatus, string> = {
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  unqualified: "Unqualified",
  converted: "Converted",
};

const STATUS_STYLE: Record<LeadStatus, { variant: NonNullable<StatusBadgeProps["variant"]>; filled?: boolean }> = {
  new: { variant: "info" },
  contacted: { variant: "warning" },
  qualified: { variant: "success" },
  unqualified: { variant: "neutral" },
  converted: { variant: "success", filled: true },
};

type Scope = "mine" | "all";

export default function LeadsPage() {
  const currentUser = mockSession.user;
  const isSalesAgent = currentUser.role === "sales_agent";

  const [leads, setLeads] = useState<Lead[]>(mockLeads);
  const [scope, setScope] = useState<Scope>(isSalesAgent ? "mine" : "all");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [sort, setSort] = useState<DataTableSort>({ key: "contactName", direction: "asc" });
  const [convertTarget, setConvertTarget] = useState<Lead | null>(null);

  const scopedLeads = useMemo(() => {
    if (isSalesAgent || scope === "mine") {
      return leads.filter((l) => l.assignedTo === currentUser.name);
    }
    return leads;
  }, [leads, isSalesAgent, scope, currentUser.name]);

  const filtered = useMemo(() => {
    const search = (filters.contactName ?? "").trim().toLowerCase();
    const statusFilter = filters.status ?? "";

    const rows = scopedLeads.filter((l) => {
      const matchesSearch = !search || l.contactName.toLowerCase().includes(search);
      const matchesStatus = !statusFilter || l.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    return [...rows].sort((a, b) => {
      const dir = sort.direction === "asc" ? 1 : -1;
      const key = sort.key as keyof Lead;
      const av = a[key];
      const bv = b[key];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      return av > bv ? dir : av < bv ? -dir : 0;
    });
  }, [scopedLeads, filters, sort]);

  const hasActiveFilters = Boolean(filters.contactName) || Boolean(filters.status);

  function handleConverted(leadId: string) {
    setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, status: "converted" as const } : l)));
  }

  const columns: DataTableColumn<Lead>[] = [
    {
      key: "contactName",
      header: "Contact Name",
      sortable: true,
      filterPlaceholder: "Search contact…",
      accessor: (l) => <span className="font-medium text-neutral-950">{l.contactName}</span>,
    },
    {
      key: "status",
      header: "Status",
      filterOptions: LEAD_STATUSES.map((s) => ({ label: STATUS_LABELS[s], value: s })),
      accessor: (l) => {
        const style = STATUS_STYLE[l.status];
        return (
          <StatusBadge variant={style.variant} filled={style.filled}>
            {STATUS_LABELS[l.status]}
          </StatusBadge>
        );
      },
    },
    { key: "score", header: "Score", sortable: true, accessor: (l) => l.score ?? <span className="text-neutral-200">—</span> },
    { key: "source", header: "Source", accessor: (l) => SOURCE_LABELS[l.source] },
    { key: "assignedTo", header: "Assigned To", accessor: (l) => l.assignedTo },
    {
      key: "actions",
      header: "",
      accessor: (l) =>
        l.status === "converted" ? null : (
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setConvertTarget(l);
            }}
          >
            Convert Lead
          </Button>
        ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Leads" breadcrumbs={[{ label: "Home", href: "/dashboard" }, { label: "CRM" }, { label: "Leads" }]}>
        {!isSalesAgent && (
          <div className="flex rounded-md border border-border p-0.5">
            <button
              type="button"
              onClick={() => setScope("mine")}
              className={cn(
                "rounded-sm px-2.5 py-1 text-xs font-medium transition-colors",
                scope === "mine" ? "bg-primary text-white" : "text-neutral-600 hover:text-neutral-950"
              )}
            >
              My records
            </button>
            <button
              type="button"
              onClick={() => setScope("all")}
              className={cn(
                "rounded-sm px-2.5 py-1 text-xs font-medium transition-colors",
                scope === "all" ? "bg-primary text-white" : "text-neutral-600 hover:text-neutral-950"
              )}
            >
              All records
            </button>
          </div>
        )}
      </PageHeader>

      <DataTable
        columns={columns}
        data={filtered}
        getRowId={(l) => l.id}
        sort={sort}
        onSortChange={(key) => setSort((prev) => ({ key, direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc" }))}
        filters={filters}
        onFilterChange={(key, value) => setFilters((prev) => ({ ...prev, [key]: value }))}
        hasMore={false}
        emptyState={
          hasActiveFilters ? (
            <EmptyState variant="filtered" ctaLabel="Clear filters" onCtaClick={() => setFilters({})} />
          ) : (
            <EmptyState
              variant="first-time"
              message="No leads yet — new leads assigned to you will show up here."
              ctaLabel="Refresh"
              onCtaClick={() => toast.info("You're all caught up — no new leads assigned yet")}
            />
          )
        }
      />

      <ConvertLeadModal
        lead={convertTarget}
        open={Boolean(convertTarget)}
        onOpenChange={(open) => !open && setConvertTarget(null)}
        onConverted={handleConverted}
      />
    </div>
  );
}
