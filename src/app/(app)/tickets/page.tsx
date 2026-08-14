"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type DataTableColumn, type DataTableSort } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { NewTicketModal } from "@/app/(app)/tickets/new-ticket-modal";
import {
  getCrmRecordForContactName,
  getSlaBadge,
  mockTickets as initialTickets,
  PRIORITY_BADGE_VARIANT,
  PRIORITY_LABELS,
  STATUS_BADGE_VARIANT,
  STATUS_LABELS,
  type Ticket,
  type TicketPriority,
  type TicketStatus,
} from "@/lib/mock-tickets";

const UNASSIGNED_FILTER_VALUE = "__unassigned__";

function ContactCell({ name }: { name: string }) {
  const record = getCrmRecordForContactName(name);
  if (!record) return <span>{name}</span>;

  const href = record.type === "contact" ? `/crm/contacts/${record.contact!.id}` : "/crm/leads";
  return (
    <Link href={href} className="text-primary hover:underline" onClick={(e) => e.stopPropagation()}>
      {name}
    </Link>
  );
}

export default function TicketsPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState<Ticket[]>(initialTickets);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [sort, setSort] = useState<DataTableSort>({ key: "sla", direction: "asc" });
  const [newTicketOpen, setNewTicketOpen] = useState(false);

  const assigneeOptions = useMemo(() => {
    const names = Array.from(new Set(tickets.map((t) => t.assignee).filter((a): a is string => Boolean(a))));
    return [
      ...names.map((name) => ({ label: name, value: name })),
      { label: "Unassigned", value: UNASSIGNED_FILTER_VALUE },
    ];
  }, [tickets]);

  const filtered = useMemo(() => {
    const rows = tickets.filter((t) => {
      if (filters.assignee) {
        if (filters.assignee === UNASSIGNED_FILTER_VALUE ? t.assignee !== null : t.assignee !== filters.assignee) return false;
      }
      if (filters.status && t.status !== filters.status) return false;
      if (filters.priority && t.priority !== filters.priority) return false;
      return true;
    });

    return [...rows].sort((a, b) => {
      const dir = sort.direction === "asc" ? 1 : -1;
      if (sort.key === "sla") {
        return (getSlaBadge(a).sortValue - getSlaBadge(b).sortValue) * dir;
      }
      const key = sort.key as keyof Ticket;
      const av = String(a[key] ?? "");
      const bv = String(b[key] ?? "");
      return av > bv ? dir : av < bv ? -dir : 0;
    });
  }, [tickets, filters, sort]);

  const hasActiveFilters = Boolean(filters.assignee || filters.status || filters.priority);

  const columns: DataTableColumn<Ticket>[] = [
    {
      key: "subject",
      header: "Subject",
      sortable: true,
      accessor: (t) => (
        <span className="font-medium text-neutral-950" title={t.subject}>
          {t.subject}
        </span>
      ),
    },
    {
      key: "contact",
      header: "Contact",
      accessor: (t) => <ContactCell name={t.contact} />,
    },
    {
      key: "priority",
      header: "Priority",
      sortable: true,
      filterOptions: (Object.keys(PRIORITY_LABELS) as TicketPriority[]).map((p) => ({ label: PRIORITY_LABELS[p], value: p })),
      accessor: (t) => <StatusBadge variant={PRIORITY_BADGE_VARIANT[t.priority]}>{PRIORITY_LABELS[t.priority]}</StatusBadge>,
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      filterOptions: (Object.keys(STATUS_LABELS) as TicketStatus[]).map((s) => ({ label: STATUS_LABELS[s], value: s })),
      accessor: (t) => <StatusBadge variant={STATUS_BADGE_VARIANT[t.status]}>{STATUS_LABELS[t.status]}</StatusBadge>,
    },
    {
      key: "sla",
      header: "SLA",
      sortable: true,
      accessor: (t) => {
        const sla = getSlaBadge(t);
        return <StatusBadge variant={sla.variant}>{sla.label}</StatusBadge>;
      },
    },
    {
      key: "assignee",
      header: "Assignee",
      filterOptions: assigneeOptions,
      accessor: (t) => t.assignee ?? <span className="text-neutral-200">Unassigned</span>,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Tickets"
        breadcrumbs={[{ label: "Home", href: "/dashboard" }, { label: "Tickets" }]}
        primaryAction={{ label: "New Ticket", icon: Plus, onClick: () => setNewTicketOpen(true) }}
      />

      <DataTable
        columns={columns}
        data={filtered}
        getRowId={(t) => t.id}
        onRowClick={(t) => router.push(`/tickets/${t.id}`)}
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
              message="No tickets yet — they'll show up here once customers reach out, or create one manually."
              ctaLabel="New Ticket"
              onCtaClick={() => setNewTicketOpen(true)}
            />
          )
        }
      />

      <NewTicketModal open={newTicketOpen} onOpenChange={setNewTicketOpen} onCreated={(ticket) => setTickets((prev) => [ticket, ...prev])} />
    </div>
  );
}
