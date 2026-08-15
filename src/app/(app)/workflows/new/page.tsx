import { draftFromTemplate, emptyWorkflowDraft, getWorkflowTemplate } from "@/lib/mock-workflows";
import { WorkflowNewClient } from "./workflow-new-client";

export default async function NewWorkflowPage({ searchParams }: { searchParams: Promise<{ template?: string }> }) {
  const params = await searchParams;
  const template = params.template ? getWorkflowTemplate(params.template) : undefined;
  return <WorkflowNewClient initial={template ? draftFromTemplate(template) : emptyWorkflowDraft()} />;
}
