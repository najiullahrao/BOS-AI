"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type DataTableColumn, type DataTableSort } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { mockCompanies, type Company } from "@/lib/mock-crm";

export default function CompaniesPage() {
  const router = useRouter();
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [sort, setSort] = useState<DataTableSort>({ key: "name", direction: "asc" });

  const filtered = useMemo(() => {
    const search = (filters.name ?? "").trim().toLowerCase();
    const rows = mockCompanies.filter(
      (c) => !search || c.name.toLowerCase().includes(search) || c.domain.toLowerCase().includes(search)
    );

    return [...rows].sort((a, b) => {
      const dir = sort.direction === "asc" ? 1 : -1;
      const key = sort.key as keyof Company;
      return a[key] > b[key] ? dir : a[key] < b[key] ? -dir : 0;
    });
  }, [filters, sort]);

  const hasActiveFilters = Boolean(filters.name);

  const columns: DataTableColumn<Company>[] = [
    { key: "name", header: "Name", sortable: true, filterPlaceholder: "Search companies…", accessor: (c) => c.name },
    { key: "domain", header: "Domain", accessor: (c) => <span className="font-mono text-xs text-neutral-600">{c.domain}</span> },
    { key: "industry", header: "Industry", sortable: true, accessor: (c) => c.industry },
    { key: "size_range", header: "Size Range", accessor: (c) => c.size_range },
    { key: "contactCount", header: "# Contacts", sortable: true, accessor: (c) => c.contactCount },
    { key: "dealCount", header: "# Deals", sortable: true, accessor: (c) => c.dealCount },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Companies" breadcrumbs={[{ label: "Home", href: "/dashboard" }, { label: "CRM" }, { label: "Companies" }]} />

      <DataTable
        columns={columns}
        data={filtered}
        getRowId={(c) => c.id}
        onRowClick={(c) => router.push(`/crm/companies/${c.id}`)}
        sort={sort}
        onSortChange={(key) => setSort((prev) => ({ key, direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc" }))}
        filters={filters}
        onFilterChange={(key, value) => setFilters((prev) => ({ ...prev, [key]: value }))}
        hasMore={false}
        emptyState={
          hasActiveFilters ? (
            <EmptyState
              variant="filtered"
              ctaLabel="Clear filters"
              onCtaClick={() => setFilters({})}
            />
          ) : (
            <EmptyState
              variant="first-time"
              message="No companies yet — they'll show up here once you add one or a contact rolls up to a new company."
              ctaLabel="Add company"
            />
          )
        }
      />
    </div>
  );
}
