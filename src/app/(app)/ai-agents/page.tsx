"use client";

import Link from "next/link";
import { BarChart3, FileText, History, LifeBuoy, TrendingUp, type LucideIcon } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { formatRelativeTime } from "@/lib/mock-crm";
import {
  AGENT_DEFS,
  AGENT_TYPES,
  getAgentRuns,
  getAgentStats,
  type AgentType,
} from "@/lib/mock-agent-runs";

const AGENT_ICONS: Record<AgentType, LucideIcon> = {
  support: LifeBuoy,
  sales: TrendingUp,
  analyst: BarChart3,
  content: FileText,
};

export default function AiAgentsPage() {
  const stats = getAgentStats();
  const recentRuns = getAgentRuns().slice(0, 4);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="AI Agents"
        breadcrumbs={[{ label: "Home", href: "/dashboard" }, { label: "AI Agents" }]}
        primaryAction={{ label: "Run history", icon: History, href: "/ai-agents/runs" }}
      />

      <div className="grid gap-4 md:grid-cols-2">
        {AGENT_TYPES.map((agent) => {
          const def = AGENT_DEFS[agent];
          const Icon = AGENT_ICONS[agent];
          const agentStats = stats[agent];
          return (
            <div key={agent} className="flex flex-col gap-3 rounded-md border border-border bg-surface p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex size-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <Icon className="size-4.5" aria-hidden="true" />
                  </span>
                  <div>
                    <h2 className="text-sm font-semibold text-neutral-950">{def.label}</h2>
                    <p className="text-xs text-neutral-600">Used on: {def.surface}</p>
                  </div>
                </div>
                <StatusBadge variant="neutral">
                  {agentStats.totalRuns} run{agentStats.totalRuns === 1 ? "" : "s"}
                </StatusBadge>
              </div>

              <p className="text-sm text-neutral-600">{def.description}</p>

              <div className="flex items-center justify-between border-t border-border pt-3">
                <div className="flex items-center gap-4 text-xs text-neutral-600">
                  <span>
                    <span className="font-medium text-success">{agentStats.completedRuns}</span> completed
                  </span>
                  <span>
                    <span className="font-medium text-danger">{agentStats.failedRuns}</span> failed
                  </span>
                  {agentStats.lastRunAt && (
                    <span className="truncate" title={agentStats.lastRunAt}>
                      Last: {formatRelativeTime(agentStats.lastRunAt)}
                    </span>
                  )}
                </div>
                <Link
                  href={`/ai-agents/runs?agent=${agent}`}
                  className="shrink-0 text-xs font-medium text-primary hover:underline"
                >
                  View history
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-md border border-border bg-surface p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-neutral-950">Recent activity</h2>
          <Link href="/ai-agents/runs" className="text-xs font-medium text-primary hover:underline">
            View all
          </Link>
        </div>
        <ul className="mt-3 flex flex-col divide-y divide-border">
          {recentRuns.map((run) => (
            <li key={run.id} className="flex items-center gap-3 py-2 text-sm">
              <span className="w-24 shrink-0 text-xs font-medium text-neutral-600">{AGENT_DEFS[run.agent].shortLabel}</span>
              <span className="min-w-0 flex-1 truncate text-neutral-950" title={run.title}>
                {run.title}
              </span>
              <StatusBadge
                variant={run.status === "completed" ? "success" : run.status === "failed" ? "danger" : "warning"}
              >
                {run.status}
              </StatusBadge>
              <span className="shrink-0 text-xs text-neutral-600">{formatRelativeTime(run.created_at)}</span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <Button variant="outline" asChild>
          <Link href="/ai-agents/runs">
            <History className="size-3.5" />
            Open run history
          </Link>
        </Button>
      </div>
    </div>
  );
}
