"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, CalendarClock, Mail, Play, Plus, Ticket, Trash2, Workflow as WorkflowIcon, type LucideIcon } from "lucide-react";
import { Switch } from "radix-ui";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Modal } from "@/components/shared/modal";
import { StatusBadge } from "@/components/shared/status-badge";
import { toast } from "@/components/shared/toast";
import { Button } from "@/components/ui/button";
import { formatRelativeTime } from "@/lib/mock-crm";
import {
  deleteWorkflow,
  getWorkflows,
  simulateWorkflowRun,
  toggleWorkflow,
  WORKFLOW_ACTION_LABELS,
  WORKFLOW_TEMPLATES,
  WORKFLOW_TRIGGER_LABELS,
  type Workflow,
} from "@/lib/mock-workflows";

const TEMPLATE_ICONS: LucideIcon[] = [Bell, Mail, Ticket, CalendarClock];

function WorkflowCard({
  workflow,
  running,
  onToggle,
  onRunNow,
  onDelete,
}: {
  workflow: Workflow;
  running: boolean;
  onToggle: (id: string, enabled: boolean) => void;
  onRunNow: (workflow: Workflow) => void;
  onDelete: (workflow: Workflow) => void;
}) {
  const visibleActions = workflow.actions.slice(0, 3);
  const extraCount = workflow.actions.length - visibleActions.length;

  return (
    <div className="flex flex-col gap-3 rounded-md border border-border bg-surface p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            <WorkflowIcon className="size-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <Link
              href={`/workflows/${workflow.id}`}
              className="block truncate text-sm font-semibold text-neutral-950 hover:text-primary hover:underline"
              title={workflow.name}
            >
              {workflow.name}
            </Link>
            <p className="truncate text-xs text-neutral-600" title={workflow.description}>
              {workflow.description}
            </p>
          </div>
        </div>
        <Switch.Root
          checked={workflow.enabled}
          onCheckedChange={(value) => onToggle(workflow.id, value)}
          aria-label={`Toggle ${workflow.name}`}
          className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent bg-neutral-200 transition-colors data-checked:bg-success"
        >
          <Switch.Thumb className="pointer-events-none block size-4 rounded-full bg-surface shadow-sm transition-transform data-checked:translate-x-4" />
        </Switch.Root>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge variant={workflow.enabled ? "info" : "neutral"}>
          {WORKFLOW_TRIGGER_LABELS[workflow.trigger.type]} · {workflow.trigger.condition}
        </StatusBadge>
        {visibleActions.map((action) => (
          <StatusBadge key={action.id} variant="neutral" dot={false} title={`${WORKFLOW_ACTION_LABELS[action.type]}: ${action.config}`}>
            {WORKFLOW_ACTION_LABELS[action.type]}: {action.config}
          </StatusBadge>
        ))}
        {extraCount > 0 && <span className="text-xs text-neutral-600">+{extraCount} more</span>}
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
        <div className="flex items-center gap-3 text-xs text-neutral-600">
          <span>
            {workflow.lastRunAt ? `Last run ${formatRelativeTime(workflow.lastRunAt)}` : "Never run"}
          </span>
          <span aria-hidden="true">·</span>
          <span>{workflow.runs} run{workflow.runs === 1 ? "" : "s"}</span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" onClick={() => onRunNow(workflow)} disabled={running || !workflow.enabled}>
            <Play className="size-3.5" />
            {running ? "Running…" : "Run now"}
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/workflows/${workflow.id}`}>Edit</Link>
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Delete ${workflow.name}`}
            onClick={() => onDelete(workflow)}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function WorkflowsPage() {
  const router = useRouter();
  const [workflows, setWorkflows] = useState<Workflow[]>(() => getWorkflows());
  const [runningId, setRunningId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Workflow | null>(null);

  function handleToggle(id: string, enabled: boolean) {
    toggleWorkflow(id, enabled);
    setWorkflows(getWorkflows());
    toast.success(enabled ? "Workflow enabled" : "Workflow paused");
  }

  async function handleRunNow(workflow: Workflow) {
    if (runningId) return;
    setRunningId(workflow.id);
    const promise = simulateWorkflowRun(workflow.id);
    setWorkflows(getWorkflows());
    await promise;
    setWorkflows(getWorkflows());
    setRunningId(null);
    toast.success(`Workflow ran`, { description: `"${workflow.name}" completed successfully.` });
  }

  function handleDelete() {
    if (!deleteTarget) return;
    deleteWorkflow(deleteTarget.id);
    setWorkflows(getWorkflows());
    toast.success("Workflow deleted", { description: `"${deleteTarget.name}" removed.` });
    setDeleteTarget(null);
  }

  const enabledCount = workflows.filter((wf) => wf.enabled).length;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Workflows"
        breadcrumbs={[{ label: "Home", href: "/dashboard" }, { label: "Workflows" }]}
        primaryAction={{ label: "New workflow", icon: Plus, href: "/workflows/new" }}
      />

      <p className="text-sm text-neutral-600">
        <span className="font-medium text-neutral-950">{enabledCount}</span> of {workflows.length} workflows active.
      </p>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-neutral-950">Templates</h2>
          <span className="text-xs text-neutral-600">Install a template, then customize it</span>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {WORKFLOW_TEMPLATES.map((template, index) => {
            const Icon = TEMPLATE_ICONS[index % TEMPLATE_ICONS.length];
            return (
              <div key={template.id} className="flex flex-col gap-3 rounded-md border border-border bg-surface p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  <h3 className="text-sm font-semibold text-neutral-950">{template.name}</h3>
                </div>
                <p className="flex-1 text-sm text-neutral-600">{template.description}</p>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge variant="info">
                    {WORKFLOW_TRIGGER_LABELS[template.trigger.type]} · {template.trigger.condition}
                  </StatusBadge>
                  <StatusBadge variant="neutral" dot={false}>
                    {template.actions.length} action{template.actions.length === 1 ? "" : "s"}
                  </StatusBadge>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/workflows/new?template=${template.id}`}>Install and customize</Link>
                </Button>
              </div>
            );
          })}
        </div>
      </section>

      {workflows.length === 0 ? (
        <EmptyState
          variant="first-time"
          icon={WorkflowIcon}
          message="No workflows yet. Automate repetitive tasks across tickets, CRM, and knowledge base."
          ctaLabel="Create workflow"
          onCtaClick={() => router.push("/workflows/new")}
        />
      ) : (
        <div className="flex flex-col gap-4">
          {workflows.map((workflow) => (
            <WorkflowCard
              key={workflow.id}
              workflow={workflow}
              running={runningId === workflow.id}
              onToggle={handleToggle}
              onRunNow={handleRunNow}
              onDelete={setDeleteTarget}
            />
          ))}
        </div>
      )}

      <Modal
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete workflow?"
        description={deleteTarget ? `"${deleteTarget.name}" will be permanently removed.` : undefined}
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" size="sm" onClick={handleDelete}>
              Delete workflow
            </Button>
          </>
        }
      >
        <p>This action can&apos;t be undone. The workflow will stop running immediately.</p>
      </Modal>
    </div>
  );
}
