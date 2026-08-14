"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type DataTableColumn, type DataTableSort } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { NewContactModal } from "@/app/(app)/crm/contacts/new-contact-modal";
import { mockCompanies, mockContacts, SOURCE_LABELS, type Contact } from "@/lib/mock-crm";

export default function ContactsPage() {
  const router = useRouter();
  const [contacts, setContacts] = useState<Contact[]>(mockContacts);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [sort, setSort] = useState<DataTableSort>({ key: "first_name", direction: "asc" });
  const [newContactOpen, setNewContactOpen] = useState(false);

  const filtered = useMemo(() => {
    const search = (filters.name ?? "").trim().toLowerCase();
    const rows = contacts.filter((c) => {
      if (!search) return true;
      const haystack = `${c.first_name} ${c.last_name} ${c.email} ${c.phone ?? ""} ${c.title} ${c.company}`.toLowerCase();
      return haystack.includes(search);
    });

    return [...rows].sort((a, b) => {
      const dir = sort.direction === "asc" ? 1 : -1;
      const key = sort.key as keyof Contact;
      const av = String(a[key] ?? "");
      const bv = String(b[key] ?? "");
      return av > bv ? dir : av < bv ? -dir : 0;
    });
  }, [contacts, filters, sort]);

  const hasActiveFilters = Boolean(filters.name);

  const columns: DataTableColumn<Contact>[] = [
    {
      key: "first_name",
      header: "Name",
      sortable: true,
      filterPlaceholder: "Search name, email, phone, title, company…",
      accessor: (c) => (
        <span className="font-medium text-neutral-950">
          {c.first_name} {c.last_name}
        </span>
      ),
    },
    { key: "email", header: "Email", accessor: (c) => <span className="text-neutral-600">{c.email}</span> },
    { key: "phone", header: "Phone", accessor: (c) => c.phone ?? <span className="text-neutral-200">—</span> },
    { key: "title", header: "Title", accessor: (c) => c.title },
    {
      key: "company",
      header: "Company",
      accessor: (c) => {
        const company = mockCompanies.find((co) => co.name === c.company);
        return company ? (
          <Link href={`/crm/companies/${company.id}`} className="text-primary hover:underline" onClick={(e) => e.stopPropagation()}>
            {c.company}
          </Link>
        ) : (
          c.company
        );
      },
    },
    { key: "source", header: "Source", accessor: (c) => SOURCE_LABELS[c.source] },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Contacts"
        breadcrumbs={[{ label: "Home", href: "/dashboard" }, { label: "CRM" }, { label: "Contacts" }]}
        primaryAction={{ label: "New Contact", icon: UserPlus, onClick: () => setNewContactOpen(true) }}
      />

      <DataTable
        columns={columns}
        data={filtered}
        getRowId={(c) => c.id}
        onRowClick={(c) => router.push(`/crm/contacts/${c.id}`)}
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
              message="No contacts yet — add your first one to start building your CRM."
              ctaLabel="New Contact"
              onCtaClick={() => setNewContactOpen(true)}
            />
          )
        }
      />

      <NewContactModal open={newContactOpen} onOpenChange={setNewContactOpen} onCreated={(contact) => setContacts((prev) => [contact, ...prev])} />
    </div>
  );
}
