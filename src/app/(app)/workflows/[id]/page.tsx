"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Play } from "lucide-react";
import { Switch } from "radix-ui";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { toast } from "@/components/shared/toast";
import { WorkflowBuilder } from "@/components/shared/workflow-builder";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatRelativeTime } from "@/lib/mock-crm";
import {
  draftFromWorkflow,
  getWorkflow,
  getWorkflowRuns,
  simulateWorkflowRun,
  toggleWorkflow,
  upsertWorkflow,
  type Workflow,
  type WorkflowDraft,
} from "@/lib/mock-workflows";

const RUN_STATUS_BADGE = {
  completed: "success",
  failed: "danger",
  running: "warning",
} as const;

export default function WorkflowEditPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [workflow, setWorkflow] = useState<Workflow | null | undefined>(undefined);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    let cancelled = false;
    params.then((p) => {
      if (cancelled) return;
      setWorkflow(getWorkflow(p.id) ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, [params]);

  async function handleRunNow() {
    if (!workflow || running) return;
    setRunning(true);
    const promise = simulateWorkflowRun(workflow.id);
    setWorkflow(getWorkflow(workflow.id));
    await promise;
    setWorkflow(getWorkflow(workflow.id));
    setRunning(false);
    toast.success("Workflow ran", { description: `"${workflow.name}" completed successfully.` });
  }

  function handleSave(draft: WorkflowDraft) {
    if (!workflow) return;
    upsertWorkflow({
      ...workflow,
      name: draft.name,
      description: draft.description,
      trigger: { type: draft.triggerType, condition: draft.condition },
      actions: draft.actions,
    });
    setWorkflow(getWorkflow(workflow.id));
    toast.success("Workflow saved");
  }

  function handleToggle(enabled: boolean) {
    if (!workflow) return;
    toggleWorkflow(workflow.id, enabled);
    setWorkflow(getWorkflow(workflow.id));
    toast.success(enabled ? "Workflow enabled" : "Workflow paused");
  }

  if (workflow === undefined) {
    return null;
  }

  if (workflow === null) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Workflow"
          breadcrumbs={[{ label: "Home", href: "/dashboard" }, { label: "Workflows", href: "/workflows" }, { label: "Not found" }]}
        />
        <EmptyState
          variant="first-time"
          message="This workflow doesn't exist or was deleted."
          ctaLabel="Back to workflows"
          onCtaClick={() => router.push("/workflows")}
        />
      </div>
    );
  }

  const runs = getWorkflowRuns(workflow.id);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={workflow.name}
        breadcrumbs={[{ label: "Home", href: "/dashboard" }, { label: "Workflows", href: "/workflows" }, { label: workflow.name }]}
      >
        <Button variant="outline" size="sm" onClick={handleRunNow} disabled={running || !workflow.enabled}>
          <Play className="size-3.5" />
          {running ? "Running…" : "Run now"}
        </Button>
      </PageHeader>

      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-sm text-neutral-600">
          <StatusBadge variant={workflow.enabled ? "success" : "neutral"}>
            {workflow.enabled ? "Active" : "Paused"}
          </StatusBadge>
          <span>
            {workflow.runs} run{workflow.runs === 1 ? "" : "s"}
          </span>
          <span aria-hidden="true">·</span>
          <span>{workflow.lastRunAt ? `Last run ${formatRelativeTime(workflow.lastRunAt)}` : "Never run"}</span>
        </div>
        <Switch.Root
          checked={workflow.enabled}
          onCheckedChange={handleToggle}
          aria-label="Enable workflow"
          className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent bg-neutral-200 transition-colors data-checked:bg-success"
        >
          <Switch.Thumb className="pointer-events-none block size-4 rounded-full bg-surface shadow-sm transition-transform data-checked:translate-x-4" />
        </Switch.Root>
      </div>

      <Tabs defaultValue="design" className="w-full">
        <TabsList variant="line" className="mb-4 w-full justify-start border-b border-border">
          <TabsTrigger value="design">Design</TabsTrigger>
          <TabsTrigger value="run-history">Run history</TabsTrigger>
        </TabsList>

        <TabsContent value="design">
          <div className="rounded-md border border-border bg-surface p-4 shadow-sm">
            <WorkflowBuilder
              initial={draftFromWorkflow(workflow)}
              onSave={handleSave}
              onCancel={() => router.push("/workflows")}
            />
          </div>
        </TabsContent>

        <TabsContent value="run-history">
          {runs.length === 0 ? (
            <EmptyState
              variant="first-time"
              message="No runs yet. Run this workflow to see results here."
              ctaLabel="Run workflow"
              onCtaClick={handleRunNow}
            />
          ) : (
            <div className="overflow-hidden rounded-md border border-border bg-surface shadow-sm">
              <ul className="divide-y divide-border">
                {runs.map((run) => (
                  <li key={run.id} className="flex items-center gap-3 px-4 py-3 text-sm">
                    <StatusBadge variant={RUN_STATUS_BADGE[run.status]}>{run.status}</StatusBadge>
                    <span className="flex-1 text-neutral-600">
                      {run.status === "running" ? "Started just now" : `Ran ${formatRelativeTime(run.startedAt)}`}
                    </span>
                    <span className="text-xs text-neutral-600">
                      {run.status === "running"
                        ? "Running…"
                        : run.durationMs >= 1000
                          ? `${(run.durationMs / 1000).toFixed(1)}s`
                          : `${run.durationMs}ms`}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
