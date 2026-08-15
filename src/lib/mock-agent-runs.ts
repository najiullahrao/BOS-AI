export type AgentType = "support" | "sales" | "analyst" | "content";
export type AgentRunStatus = "completed" | "failed" | "running";

export interface AgentRun {
  id: string;
  agent: AgentType;
  title: string;
  status: AgentRunStatus;
  created_at: string;
  duration_ms: number;
}

export interface AgentDef {
  label: string;
  shortLabel: string;
  description: string;
  surface: string;
}

export const AGENT_DEFS: Record<AgentType, AgentDef> = {
  support: {
    label: "Support Agent",
    shortLabel: "Support",
    description: "Drafts replies and summarizes customer threads against the knowledge base.",
    surface: "Ticket detail",
  },
  sales: {
    label: "Sales Agent",
    shortLabel: "Sales",
    description: "Summarizes deals and drafts follow-up outreach from CRM data.",
    surface: "Deal detail",
  },
  analyst: {
    label: "Analyst Agent",
    shortLabel: "Analyst",
    description: "Turns performance data into plain-language insights.",
    surface: "Analytics",
  },
  content: {
    label: "Content Agent",
    shortLabel: "Content",
    description: "Improves and summarizes knowledge base documents.",
    surface: "Knowledge Base",
  },
};

export const AGENT_TYPES = Object.keys(AGENT_DEFS) as AgentType[];

let runStore: AgentRun[] = [
  {
    id: "run_001",
    agent: "support",
    title: "Suggest Reply · Wi-Fi dropouts at HQ",
    status: "completed",
    created_at: "2026-07-11T09:41:00Z",
    duration_ms: 940,
  },
  {
    id: "run_002",
    agent: "sales",
    title: "Draft follow-up · Acme Robotics expansion",
    status: "completed",
    created_at: "2026-07-11T08:12:00Z",
    duration_ms: 1260,
  },
  {
    id: "run_003",
    agent: "analyst",
    title: "Analyze Q2 ticket volume",
    status: "completed",
    created_at: "2026-07-10T16:05:00Z",
    duration_ms: 2100,
  },
  {
    id: "run_004",
    agent: "content",
    title: "Suggest improvements · Exporting Large Reports",
    status: "failed",
    created_at: "2026-07-10T13:28:00Z",
    duration_ms: 680,
  },
  {
    id: "run_005",
    agent: "support",
    title: "Summarize Thread · Billing dispute #1452",
    status: "completed",
    created_at: "2026-07-10T10:47:00Z",
    duration_ms: 760,
  },
  {
    id: "run_006",
    agent: "sales",
    title: "Summarize deal · Atlas Imports",
    status: "completed",
    created_at: "2026-07-09T15:02:00Z",
    duration_ms: 820,
  },
  {
    id: "run_007",
    agent: "analyst",
    title: "Analyze SLA compliance",
    status: "completed",
    created_at: "2026-07-09T09:33:00Z",
    duration_ms: 1890,
  },
  {
    id: "run_008",
    agent: "content",
    title: "Summarize doc · Remote Work Policy",
    status: "completed",
    created_at: "2026-07-08T14:19:00Z",
    duration_ms: 710,
  },
];

function randomId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

export function getAgentRuns(): AgentRun[] {
  return [...runStore];
}

export function getRunsForAgent(agent: AgentType): AgentRun[] {
  return runStore.filter((run) => run.agent === agent);
}

/** Prepends a run and returns the stored copy. Mutates the in-memory mock store. */
export function recordAgentRun(run: Pick<AgentRun, "agent" | "title" | "status" | "duration_ms">): AgentRun {
  const full: AgentRun = {
    id: randomId("run"),
    agent: run.agent,
    title: run.title,
    status: run.status,
    duration_ms: run.duration_ms,
    created_at: new Date().toISOString(),
  };
  runStore = [full, ...runStore];
  return full;
}

export interface SimulateRunInput {
  agent: AgentType;
  title: string;
  fail?: boolean;
  ms?: number;
}

/**
 * Records a "running" run, then resolves as completed (or failed) after a mock
 * delay — used by the demo "Run" buttons across agent surfaces.
 */
export function simulateAgentRun(input: SimulateRunInput): Promise<AgentRun> {
  const delayMs = input.ms ?? 900;
  const running = recordAgentRun({ ...input, status: "running", duration_ms: 0 });

  return new Promise((resolve) => {
    window.setTimeout(() => {
      const next: AgentRun = {
        ...running,
        status: input.fail ? "failed" : "completed",
        duration_ms: delayMs,
      };
      runStore = runStore.map((run) => (run.id === running.id ? next : run));
      resolve(next);
    }, delayMs);
  });
}

export interface AgentStats {
  totalRuns: number;
  completedRuns: number;
  failedRuns: number;
  lastRunAt: string | null;
}

export function getAgentStats(): Record<AgentType, AgentStats> {
  const stats = {} as Record<AgentType, AgentStats>;
  for (const agent of AGENT_TYPES) {
    const runs = getRunsForAgent(agent);
    stats[agent] = {
      totalRuns: runs.length,
      completedRuns: runs.filter((r) => r.status === "completed").length,
      failedRuns: runs.filter((r) => r.status === "failed").length,
      lastRunAt: runs.length > 0 ? runs[0].created_at : null,
    };
  }
  return stats;
}

export function formatRunDuration(ms: number): string {
  if (ms <= 0) return "—";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

/** Demo titles used by the "Run demo" control on the run history page. */
export const DEMO_RUN_TITLES: Record<AgentType, string> = {
  support: "Suggest Reply · Demo ticket",
  sales: "Draft follow-up · Demo deal",
  analyst: "Analyze weekly performance",
  content: "Suggest improvements · Getting Started Guide",
};
