export type WorkflowTriggerType = "ticket_created" | "ticket_status_changed" | "deal_stage_changed" | "new_lead" | "scheduled";

export const WORKFLOW_TRIGGER_LABELS: Record<WorkflowTriggerType, string> = {
  ticket_created: "Ticket created",
  ticket_status_changed: "Ticket status changed",
  deal_stage_changed: "Deal stage changed",
  new_lead: "New lead added",
  scheduled: "Scheduled",
};

export const WORKFLOW_TRIGGER_PLACEHOLDERS: Record<WorkflowTriggerType, string> = {
  ticket_created: "e.g. priority → urgent",
  ticket_status_changed: "e.g. status → resolved",
  deal_stage_changed: "e.g. stage → closed won",
  new_lead: "e.g. source → referral",
  scheduled: "e.g. every weekday at 9:00",
};

export type WorkflowActionType = "notify_team" | "send_email" | "create_ticket" | "invoke_ai_agent";

export const WORKFLOW_ACTION_TYPES: WorkflowActionType[] = [
  "notify_team",
  "send_email",
  "create_ticket",
  "invoke_ai_agent",
];

export const WORKFLOW_ACTION_LABELS: Record<WorkflowActionType, string> = {
  notify_team: "Notify team member",
  send_email: "Send email",
  create_ticket: "Create ticket",
  invoke_ai_agent: "Run AI agent",
};

export const WORKFLOW_ACTION_CONFIG_LABELS: Record<WorkflowActionType, string> = {
  notify_team: "Recipient",
  send_email: "Template",
  create_ticket: "Subject",
  invoke_ai_agent: "Instructions",
};

export const WORKFLOW_ACTION_CONFIG_PLACEHOLDERS: Record<WorkflowActionType, string> = {
  notify_team: "e.g. @support in #tickets",
  send_email: "e.g. Thank-you template",
  create_ticket: "e.g. Escalation ticket",
  invoke_ai_agent: "Summarize the thread and draft a reply",
};

export const WORKFLOW_ACTION_DEFAULTS: Record<WorkflowActionType, string> = {
  notify_team: "@support in #tickets",
  send_email: "Thank-you template",
  create_ticket: "Escalation ticket",
  invoke_ai_agent: "Draft a reply based on the knowledge base",
};

export const INVOKE_AI_AGENT_HELPER = "Output is saved as a draft for human review -- it is never auto-sent";

export interface WorkflowTrigger {
  type: WorkflowTriggerType;
  condition: string;
}

export interface WorkflowAction {
  id: string;
  type: WorkflowActionType;
  config: string;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  trigger: WorkflowTrigger;
  actions: WorkflowAction[];
  enabled: boolean;
  lastRunAt: string | null;
  runs: number;
  createdAt: string;
}

export type WorkflowRunStatus = "completed" | "failed" | "running";

export interface WorkflowRun {
  id: string;
  workflowId: string;
  status: WorkflowRunStatus;
  startedAt: string;
  durationMs: number;
}

let workflowStore: Workflow[] = [
  {
    id: "wf_1",
    name: "Resolved ticket → notify team",
    description: "Pings the support channel when a ticket moves to resolved.",
    trigger: { type: "ticket_status_changed", condition: "status → resolved" },
    actions: [
      { id: "wfa_1", type: "notify_team", config: "@support in #tickets" },
      { id: "wfa_2", type: "invoke_ai_agent", config: "Summarize the resolution for the changelog" },
    ],
    enabled: true,
    lastRunAt: "2026-07-11T09:02:00Z",
    runs: 214,
    createdAt: "2026-05-01T09:00:00Z",
  },
  {
    id: "wf_2",
    name: "Won deal → follow-up email",
    description: "Sends a thank-you and next-steps email when a deal closes.",
    trigger: { type: "deal_stage_changed", condition: "stage → closed won" },
    actions: [
      { id: "wfa_3", type: "send_email", config: "Thank-you template" },
      { id: "wfa_4", type: "notify_team", config: "Ping the account owner" },
    ],
    enabled: true,
    lastRunAt: "2026-07-10T15:30:00Z",
    runs: 87,
    createdAt: "2026-05-10T09:00:00Z",
  },
  {
    id: "wf_3",
    name: "Urgent ticket escalation",
    description: "Creates an escalation ticket and pages on-call for urgent issues.",
    trigger: { type: "ticket_created", condition: "priority → urgent" },
    actions: [
      { id: "wfa_5", type: "create_ticket", config: "Escalation ticket" },
      { id: "wfa_6", type: "notify_team", config: "@on-call" },
    ],
    enabled: false,
    lastRunAt: "2026-07-08T11:12:00Z",
    runs: 31,
    createdAt: "2026-05-22T09:00:00Z",
  },
];

let workflowRunStore: WorkflowRun[] = [
  { id: "wfr_1", workflowId: "wf_1", status: "completed", startedAt: "2026-07-11T09:02:00Z", durationMs: 860 },
  { id: "wfr_2", workflowId: "wf_2", status: "completed", startedAt: "2026-07-10T15:30:00Z", durationMs: 940 },
  { id: "wfr_3", workflowId: "wf_1", status: "completed", startedAt: "2026-07-10T08:21:00Z", durationMs: 810 },
  { id: "wfr_4", workflowId: "wf_3", status: "failed", startedAt: "2026-07-08T11:12:00Z", durationMs: 650 },
  { id: "wfr_5", workflowId: "wf_2", status: "completed", startedAt: "2026-07-08T10:05:00Z", durationMs: 900 },
];

function randomId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

export function nextWorkflowId(): string {
  return randomId("wf");
}

export function nextWorkflowActionId(): string {
  return randomId("wfa");
}

export function getWorkflows(): Workflow[] {
  return [...workflowStore];
}

export function getWorkflow(id: string): Workflow | undefined {
  return workflowStore.find((wf) => wf.id === id);
}

export function upsertWorkflow(workflow: Workflow): void {
  const exists = workflowStore.some((wf) => wf.id === workflow.id);
  workflowStore = exists
    ? workflowStore.map((wf) => (wf.id === workflow.id ? workflow : wf))
    : [workflow, ...workflowStore];
}

export function deleteWorkflow(id: string): void {
  workflowStore = workflowStore.filter((wf) => wf.id !== id);
  workflowRunStore = workflowRunStore.filter((run) => run.workflowId !== id);
}

export function toggleWorkflow(id: string, enabled: boolean): void {
  workflowStore = workflowStore.map((wf) => (wf.id === id ? { ...wf, enabled } : wf));
}

export function getWorkflowRuns(workflowId: string): WorkflowRun[] {
  return workflowRunStore.filter((run) => run.workflowId === workflowId);
}

export function simulateWorkflowRun(workflowId: string): Promise<WorkflowRun> {
  const startedAt = new Date().toISOString();
  const running: WorkflowRun = { id: randomId("wfr"), workflowId, status: "running", startedAt, durationMs: 0 };
  workflowRunStore = [running, ...workflowRunStore];
  workflowStore = workflowStore.map((wf) =>
    wf.id === workflowId ? { ...wf, runs: wf.runs + 1, lastRunAt: startedAt } : wf
  );

  return new Promise((resolve) => {
    window.setTimeout(() => {
      const completed: WorkflowRun = { ...running, status: "completed", durationMs: 900 };
      workflowRunStore = workflowRunStore.map((run) => (run.id === running.id ? completed : run));
      resolve(completed);
    }, 900);
  });
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  trigger: WorkflowTrigger;
  actions: WorkflowAction[];
}

export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    id: "resolved-notification",
    name: "Resolved ticket notification",
    description: "Notify the team and draft a changelog summary whenever a ticket is resolved.",
    trigger: { type: "ticket_status_changed", condition: "status → resolved" },
    actions: [
      { id: "wft_1", type: "notify_team", config: "@support in #tickets" },
      { id: "wft_2", type: "invoke_ai_agent", config: "Summarize the resolution for the changelog" },
    ],
  },
  {
    id: "won-deal-followup",
    name: "Won deal follow-up",
    description: "Send a thank-you email and notify the account owner when a deal closes.",
    trigger: { type: "deal_stage_changed", condition: "stage → closed won" },
    actions: [
      { id: "wft_3", type: "send_email", config: "Thank-you template" },
      { id: "wft_4", type: "notify_team", config: "Ping the account owner" },
    ],
  },
  {
    id: "urgent-escalation",
    name: "Urgent ticket escalation",
    description: "Create an escalation ticket and page on-call when urgent issues come in.",
    trigger: { type: "ticket_created", condition: "priority → urgent" },
    actions: [
      { id: "wft_5", type: "create_ticket", config: "Escalation ticket" },
      { id: "wft_6", type: "notify_team", config: "@on-call" },
    ],
  },
  {
    id: "weekly-digest",
    name: "Weekly performance digest",
    description: "Summarize last week's performance with the Analyst Agent every weekday morning.",
    trigger: { type: "scheduled", condition: "every weekday at 9:00" },
    actions: [
      { id: "wft_7", type: "invoke_ai_agent", config: "Summarize last week's ticket and deal performance" },
    ],
  },
];

export function getWorkflowTemplate(id: string): WorkflowTemplate | undefined {
  return WORKFLOW_TEMPLATES.find((template) => template.id === id);
}

export interface WorkflowDraft {
  name: string;
  description: string;
  triggerType: WorkflowTriggerType;
  condition: string;
  actions: WorkflowAction[];
}

export function emptyWorkflowDraft(): WorkflowDraft {
  return { name: "", description: "", triggerType: "ticket_created", condition: "", actions: [] };
}

export function draftFromTemplate(template: WorkflowTemplate): WorkflowDraft {
  return {
    name: template.name,
    description: template.description,
    triggerType: template.trigger.type,
    condition: template.trigger.condition,
    actions: template.actions.map((action) => ({ ...action, id: nextWorkflowActionId() })),
  };
}

export function draftFromWorkflow(workflow: Workflow): WorkflowDraft {
  return {
    name: workflow.name,
    description: workflow.description,
    triggerType: workflow.trigger.type,
    condition: workflow.trigger.condition,
    actions: workflow.actions.map((action) => ({ ...action })),
  };
}
