"use client";

import { useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { KanbanBoard, type KanbanColumn } from "@/components/shared/kanban-board";
import { toast } from "@/components/shared/toast";

const INITIAL_COLUMNS: KanbanColumn[] = [
  {
    id: "todo",
    title: "To do",
    cards: [
      { id: "c_1", title: "Draft onboarding email sequence", description: "3 steps", badge: { label: "low", variant: "neutral" } },
      { id: "c_2", title: "Review AI auto-tagging rules", badge: { label: "medium", variant: "warning" } },
    ],
  },
  {
    id: "in_progress",
    title: "In progress",
    cards: [{ id: "c_3", title: "Migrate ticket routing to workflow v2", badge: { label: "high", variant: "danger" } }],
  },
  {
    id: "done",
    title: "Done",
    cards: [{ id: "c_4", title: "Set up Slack notification workflow", badge: { label: "done", variant: "success" } }],
  },
];

export default function WorkflowsPage() {
  const [columns, setColumns] = useState(INITIAL_COLUMNS);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Workflows" breadcrumbs={[{ label: "Home", href: "/dashboard" }, { label: "Workflows" }]} />
      <KanbanBoard
        columns={columns}
        onColumnsChange={setColumns}
        onCardClick={(card) => toast.info(`Opened "${card.title}"`)}
      />
    </div>
  );
}
