"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { KanbanBoard, type KanbanColumn } from "@/components/shared/kanban-board";
import type { KanbanCardData } from "@/components/shared/kanban-card";
import type { StatusBadgeProps } from "@/components/shared/status-badge";
import { toast } from "@/components/shared/toast";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getUserInitials, mockSession } from "@/lib/mock-data";
import {
  mockDeals,
  formatCurrency,
  formatShortDate,
  MOCK_NOW,
  PIPELINE_STAGE_LABELS,
  PIPELINE_STAGE_ORDER,
  type Deal,
  type PipelineStage,
} from "@/lib/mock-crm";

function getDueDateDisplay(deal: Deal): { label: string; variant: NonNullable<StatusBadgeProps["variant"]> } {
  if (deal.status !== "open") {
    return { label: `Closed ${formatShortDate(deal.expected_close_date)}`, variant: "neutral" };
  }
  const diffDays = Math.round((new Date(deal.expected_close_date).getTime() - MOCK_NOW.getTime()) / 86_400_000);
  if (diffDays < 0) {
    const overdueDays = Math.abs(diffDays);
    return { label: `${overdueDays} day${overdueDays === 1 ? "" : "s"} overdue`, variant: "danger" };
  }
  if (diffDays === 0) return { label: "Due today", variant: "warning" };
  return { label: `in ${diffDays} day${diffDays === 1 ? "" : "s"}`, variant: "neutral" };
}

function canDragDeal(deal: Deal, currentUserName: string, currentUserRole: string): boolean {
  if (currentUserRole !== "sales_agent") return true;
  return deal.assignedTo === currentUserName;
}

function dealToCard(deal: Deal, draggable: boolean): KanbanCardData {
  const due = getDueDateDisplay(deal);
  return {
    id: deal.id,
    title: deal.name,
    description: deal.company,
    badge: { label: due.label, variant: due.variant },
    meta: (
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-neutral-950">{formatCurrency(deal.amount, deal.currency)}</span>
        <Avatar size="sm">
          <AvatarFallback>{getUserInitials(deal.assignedTo)}</AvatarFallback>
        </Avatar>
      </div>
    ),
    disabled: !draggable,
    disabledReason: draggable ? undefined : "Not assigned to you",
  };
}

function buildInitialColumns(deals: Deal[], currentUserName: string, currentUserRole: string): KanbanColumn[] {
  return PIPELINE_STAGE_ORDER.map((stage) => ({
    id: stage,
    title: PIPELINE_STAGE_LABELS[stage],
    cards: deals
      .filter((d) => d.pipeline_stage === stage)
      .map((d) => dealToCard(d, canDragDeal(d, currentUserName, currentUserRole))),
  }));
}

function PipelineSummary({ columns, dealsById }: { columns: KanbanColumn[]; dealsById: Map<string, Deal> }) {
  const rows = columns.map((col) => {
    const deals = col.cards.map((c) => dealsById.get(c.id)).filter((d): d is Deal => Boolean(d));
    const total = deals.reduce((sum, d) => sum + d.amount, 0);
    const currency = deals[0]?.currency ?? "USD";
    return { stage: col.id, label: col.title, count: deals.length, total, currency };
  });

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {rows.map((row) => (
        <div key={row.stage} className="rounded-md border border-border bg-surface p-3 shadow-sm">
          <p className="text-xs font-medium text-neutral-600">{row.label}</p>
          <p className="mt-1 text-lg font-semibold text-neutral-950">{formatCurrency(row.total, row.currency)}</p>
          <p className="text-xs text-neutral-600">
            {row.count} deal{row.count === 1 ? "" : "s"}
          </p>
        </div>
      ))}
    </div>
  );
}

export default function DealsPage() {
  const router = useRouter();
  const currentUser = mockSession.user;
  const dealsById = useMemo(() => new Map(mockDeals.map((d) => [d.id, d])), []);

  const [columns, setColumns] = useState<KanbanColumn[]>(() =>
    buildInitialColumns(mockDeals, currentUser.name, currentUser.role)
  );

  function handleCardMoved(cardId: string, fromColumnId: string, toColumnId: string) {
    if (fromColumnId === toColumnId) return;
    const stageLabel = PIPELINE_STAGE_LABELS[toColumnId as PipelineStage] ?? toColumnId;
    toast.success(`Moved to ${stageLabel}`);
    // In the real system, this stage change would also auto-log to the
    // deal's activity timeline as a system event (server-side). This is a
    // frontend-only stub for the pipeline view — no activity logging here.
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Deals" breadcrumbs={[{ label: "Home", href: "/dashboard" }, { label: "CRM" }, { label: "Deals" }]} />

      <PipelineSummary columns={columns} dealsById={dealsById} />

      <KanbanBoard
        columns={columns}
        onColumnsChange={setColumns}
        onCardMoved={handleCardMoved}
        onCardClick={(card) => router.push(`/crm/deals/${card.id}`)}
      />
    </div>
  );
}
