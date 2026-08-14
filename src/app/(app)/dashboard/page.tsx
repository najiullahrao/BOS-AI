"use client";

import Link from "next/link";
import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { AIPanel } from "@/components/shared/ai-panel";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/shared/toast";
import { getSlaBadge, mockTickets } from "@/lib/mock-tickets";

const ACTIVE_STATUSES = new Set(["open", "pending"]);

function TicketsSummaryCard() {
  const activeCount = mockTickets.filter((t) => ACTIVE_STATUSES.has(t.status)).length;

  const atRisk = mockTickets
    .filter((t) => ACTIVE_STATUSES.has(t.status))
    .map((t) => ({ ticket: t, sla: getSlaBadge(t) }))
    .filter(({ sla }) => sla.variant === "danger")
    .sort((a, b) => a.sla.sortValue - b.sla.sortValue);

  return (
    <div className="flex flex-col gap-3 rounded-md border border-border bg-surface p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-neutral-950">Tickets</h2>
        <Link href="/tickets" className="text-sm text-primary hover:underline">
          View all tickets
        </Link>
      </div>

      <div className="flex gap-6">
        <div>
          <p className="text-2xl font-semibold text-neutral-950">{activeCount}</p>
          <p className="text-xs text-neutral-600">Active tickets (open + pending)</p>
        </div>
        <div>
          <p className="text-2xl font-semibold text-neutral-950">{atRisk.length}</p>
          <p className="text-xs text-neutral-600">Need attention (SLA)</p>
        </div>
      </div>

      {atRisk.length > 0 && (
        <ul className="flex flex-col gap-2 border-t border-border pt-3">
          {atRisk.slice(0, 3).map(({ ticket, sla }) => (
            <li key={ticket.id} className="flex items-center justify-between gap-3 text-sm">
              <Link
                href={`/tickets/${ticket.id}`}
                className="min-w-0 flex-1 truncate text-neutral-950 hover:text-primary hover:underline"
                title={ticket.subject}
              >
                {ticket.subject}
              </Link>
              <StatusBadge variant={sla.variant}>{sla.label}</StatusBadge>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function TicketsAIInsight() {
  const [dismissed, setDismissed] = useState(false);
  const [mostUrgent] = mockTickets
    .filter((t) => ACTIVE_STATUSES.has(t.status))
    .map((t) => ({ ticket: t, sla: getSlaBadge(t) }))
    .sort((a, b) => a.sla.sortValue - b.sla.sortValue);

  if (dismissed || !mostUrgent) return null;

  return (
    <AIPanel
      label="AI Suggested"
      content={
        <p>
          &quot;{mostUrgent.ticket.subject}&quot; ({mostUrgent.ticket.contact}) is the most urgent active ticket —{" "}
          {mostUrgent.sla.label.toLowerCase()}. Consider checking in before it breaches SLA.
        </p>
      }
      onInsert={() => (window.location.href = `/tickets/${mostUrgent.ticket.id}`)}
      onDiscard={() => setDismissed(true)}
    />
  );
}

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Dashboard" breadcrumbs={[{ label: "Home" }, { label: "Dashboard" }]}>
        <Button variant="outline" size="sm" onClick={() => toast.success("Data refreshed")}>
          <RefreshCw className="size-3.5" />
          Refresh
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <TicketsSummaryCard />
        <aside className="flex flex-col gap-4">
          <TicketsAIInsight />
        </aside>
      </div>
    </div>
  );
}
