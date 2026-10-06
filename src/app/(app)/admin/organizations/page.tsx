"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type DataTableColumn, type DataTableSort } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { Modal } from "@/components/shared/modal";
import { toast } from "@/components/shared/toast";
import { Button } from "@/components/ui/button";
import {
  ORG_PLAN_BADGE,
  ORG_STATUS_BADGE,
  setOrgStatus,
  type AdminOrgStatus,
  type AdminOrganization,
} from "@/lib/mock-admin";
import { useAdminOrgs } from "@/lib/use-mock-admin";

const PLAN_FILTERS = [
  { label: "Free", value: "free" },
  { label: "Pro", value: "pro" },
  { label: "Enterprise", value: "enterprise" },
];

const STATUS_FILTERS = [
  { label: "Active", value: "active" },
  { label: "Suspended", value: "suspended" },
  { label: "Past due", value: "past_due" },
  { label: "Deleted (pending purge)", value: "deleted_pending_purge" },
];

export default function AdminOrganizationsPage() {
  const router = useRouter();
  const { orgs } = useAdminOrgs();
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [sort, setSort] = useState<DataTableSort>({ key: "createdAt", direction: "desc" });
  const [actionTarget, setActionTarget] = useState<AdminOrganization | null>(null);

  const filteredOrgs = useMemo(() => {
    const nameSearch = (filters.name ?? "").trim().toLowerCase();
    const planFilter = filters.plan ?? "";
    const statusFilter = filters.status ?? "";

    const filtered = orgs.filter((org) => {
      const matchesName = !nameSearch || org.name.toLowerCase().includes(nameSearch);
      const matchesPlan = !planFilter || org.plan === planFilter;
      const matchesStatus = !statusFilter || org.status === statusFilter;
      return matchesName && matchesPlan && matchesStatus;
    });

    const sorted = [...filtered].sort((a, b) => {
      const dir = sort.direction === "asc" ? 1 : -1;
      const key = sort.key as keyof AdminOrganization;
      const aVal = a[key];
      const bVal = b[key];
      if (typeof aVal === "number" && typeof bVal === "number") return (aVal - bVal) * dir;
      return String(aVal) > String(bVal) ? dir : String(aVal) < String(bVal) ? -dir : 0;
    });

    return sorted;
  }, [orgs, filters, sort]);

  function handleConfirmAction() {
    if (!actionTarget) return;
    const nextStatus: AdminOrgStatus = actionTarget.status === "suspended" ? "active" : "suspended";
    setOrgStatus(actionTarget.id, nextStatus);
    const label = nextStatus === "suspended" ? "suspended" : "reinstate";
    toast.success(`${actionTarget.name} ${label === "suspended" ? "suspended" : "was reinstated"}`);
    setActionTarget(null);
  }

  const columns: DataTableColumn<AdminOrganization>[] = [
    {
      key: "name",
      header: "Organization",
      sortable: true,
      filterPlaceholder: "Search orgs…",
      accessor: (org) => (
        <div className="flex items-center gap-2.5">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-neutral-100 text-neutral-600">
            <Building2 className="size-3.5" aria-hidden="true" />
          </span>
          <span className="font-medium text-neutral-950">{org.name}</span>
        </div>
      ),
    },
    {
      key: "plan",
      header: "Plan",
      filterOptions: PLAN_FILTERS,
      accessor: (org) => <StatusBadge variant={ORG_PLAN_BADGE[org.plan]} dot={false}>{org.plan}</StatusBadge>,
    },
    {
      key: "seatCount",
      header: "Seats",
      sortable: true,
      accessor: (org) => <span className="text-neutral-600">{org.seatCount}</span>,
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      filterOptions: STATUS_FILTERS,
      accessor: (org) => (
        <StatusBadge variant={ORG_STATUS_BADGE[org.status]}>
          {org.status === "deleted_pending_purge" ? "deleted" : org.status}
        </StatusBadge>
      ),
    },
    {
      key: "createdAt",
      header: "Created",
      sortable: true,
      accessor: (org) => <span className="text-neutral-600">{org.createdAt}</span>,
    },
    {
      key: "actions",
      header: "",
      accessor: (org) =>
        org.status === "deleted_pending_purge" ? null : (
          <Button
            variant={org.status === "suspended" ? "outline" : "ghost"}
            size="sm"
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              setActionTarget(org);
            }}
          >
            {org.status === "suspended" ? "Reinstate" : "Suspend"}
          </Button>
        ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Organizations"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Admin Portal", href: "/admin" },
          { label: "Organizations" },
        ]}
      />

      <DataTable
        columns={columns}
        data={filteredOrgs}
        getRowId={(org) => org.id}
        onRowClick={(org) => router.push(`/admin/organizations/${org.id}`)}
        sort={sort}
        onSortChange={(key) =>
          setSort((prev) => ({ key, direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc" }))
        }
        filters={filters as unknown as Record<string, string>}
        onFilterChange={(key, value) => setFilters((prev) => ({ ...prev, [key]: value }))}
        hasMore={false}
      />

      <Modal
        open={Boolean(actionTarget)}
        onOpenChange={(open) => !open && setActionTarget(null)}
        title={actionTarget?.status === "suspended" ? "Reinstate organization" : "Suspend organization"}
        description={
          actionTarget
            ? actionTarget.status === "suspended"
              ? `This restores access for ${actionTarget.name}.`
              : `This immediately suspends all access for ${actionTarget.name}.`
            : undefined
        }
        footer={
          <>
            <Button variant="outline" onClick={() => setActionTarget(null)}>
              Cancel
            </Button>
            <Button
              variant={actionTarget?.status === "suspended" ? "default" : "destructive"}
              onClick={handleConfirmAction}
            >
              {actionTarget?.status === "suspended" ? "Reinstate" : "Suspend"}
            </Button>
          </>
        }
      >
        <p className="text-sm text-neutral-600">
          {actionTarget?.status === "suspended"
            ? "Members will regain access and the organization will leave read-only mode."
            : "Members will lose access immediately. You can reinstate the organization at any time."}
        </p>
      </Modal>
    </div>
  );
}