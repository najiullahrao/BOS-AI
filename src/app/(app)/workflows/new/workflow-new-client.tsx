"use client";

import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { toast } from "@/components/shared/toast";
import { WorkflowBuilder } from "@/components/shared/workflow-builder";
import { nextWorkflowId, upsertWorkflow, type Workflow, type WorkflowDraft } from "@/lib/mock-workflows";

export function WorkflowNewClient({ initial }: { initial: WorkflowDraft }) {
  const router = useRouter();

  function handleSave(draft: WorkflowDraft) {
    const workflow: Workflow = {
      id: nextWorkflowId(),
      name: draft.name,
      description: draft.description,
      trigger: { type: draft.triggerType, condition: draft.condition },
      actions: draft.actions,
      enabled: true,
      lastRunAt: null,
      runs: 0,
      createdAt: new Date().toISOString(),
    };
    upsertWorkflow(workflow);
    toast.success("Workflow created", { description: `"${workflow.name}" is now active.` });
    router.push("/workflows");
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="New workflow"
        breadcrumbs={[{ label: "Home", href: "/dashboard" }, { label: "Workflows", href: "/workflows" }, { label: "New workflow" }]}
      />
      <WorkflowBuilder
        initial={initial}
        onSave={handleSave}
        onCancel={() => router.push("/workflows")}
      />
    </div>
  );
}
