"use client";

import { useEffect, useMemo, useState } from "react";
import { Play } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type DataTableColumn, type DataTableSort } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { formatRelativeTime } from "@/lib/mock-crm";
import {
  AGENT_DEFS,
  AGENT_TYPES,
  DEMO_RUN_TITLES,
  formatRunDuration,
  getAgentRuns,
  simulateAgentRun,
  type AgentRun,
  type AgentRunStatus,
  type AgentType,
} from "@/lib/mock-agent-runs";

const AGENT_FILTER_OPTIONS = AGENT_TYPES.map((agent) => ({ label: AGENT_DEFS[agent].shortLabel, value: agent }));
const STATUS_FILTER_OPTIONS: { label: string; value: string }[] = [
  { label: "Completed", value: "completed" },
  { label: "Failed", value: "failed" },
  { label: "Running", value: "running" },
];

const STATUS_BADGE: Record<AgentRunStatus, { variant: "success" | "danger" | "warning" }> = {
  completed: { variant: "success" },
  failed: { variant: "danger" },
  running: { variant: "warning" },
};

export default function AgentRunsPage({ searchParams }: { searchParams: Promise<{ agent?: string }> }) {
  const [runs, setRuns] = useState<AgentRun[]>(getAgentRuns);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [sort, setSort] = useState<DataTableSort>({ key: "created_at", direction: "desc" });
  const [running, setRunning] = useState(false);

  useEffect(() => {
    searchParams.then((params) => {
      const agent = params.agent;
      if (agent) setFilters((prev) => ({ ...prev, agent }));
    });
  }, [searchParams]);

  const filtered = useMemo(() => {
    const search = (filters.title ?? "").trim().toLowerCase();
    const rows = runs.filter((run) => {
      if (filters.agent && run.agent !== filters.agent) return false;
      if (filters.status && run.status !== filters.status) return false;
      if (search && !run.title.toLowerCase().includes(search)) return false;
      return true;
    });
    return [...rows].sort((a, b) => {
      const dir = sort.direction === "asc" ? 1 : -1;
      if (sort.key === "created_at") {
        return a.created_at > b.created_at ? dir : a.created_at < b.created_at ? -dir : 0;
      }
      if (sort.key === "duration_ms") {
        return (a.duration_ms - b.duration_ms) * dir;
      }
      return 0;
    });
  }, [runs, filters, sort]);

  const hasActiveFilters = Boolean(filters.agent || filters.status || filters.title);

  function refreshRuns() {
    setRuns(getAgentRuns());
  }

  async function handleRunDemo() {
    if (running) return;
    setRunning(true);
    const agents = AGENT_TYPES;
    const agent = agents[Math.floor(Math.random() * agents.length)] as AgentType;
    simulateAgentRun({ agent, title: DEMO_RUN_TITLES[agent], ms: 1100 });
    refreshRuns();
    await new Promise((resolve) => window.setTimeout(resolve, 1200));
    refreshRuns();
    setRunning(false);
  }

  const columns: DataTableColumn<AgentRun>[] = [
    {
      key: "agent",
      header: "Agent",
      filterOptions: AGENT_FILTER_OPTIONS,
      accessor: (run) => <StatusBadge variant="neutral">{AGENT_DEFS[run.agent].shortLabel}</StatusBadge>,
    },
    {
      key: "title",
      header: "Run",
      filterPlaceholder: "Search runs…",
      accessor: (run) => <span className="font-medium text-neutral-950">{run.title}</span>,
    },
    {
      key: "status",
      header: "Status",
      filterOptions: STATUS_FILTER_OPTIONS,
      accessor: (run) => <StatusBadge variant={STATUS_BADGE[run.status].variant}>{run.status}</StatusBadge>,
    },
    {
      key: "duration_ms",
      header: "Duration",
      sortable: true,
      accessor: (run) => <span className="text-neutral-600">{formatRunDuration(run.duration_ms)}</span>,
    },
    {
      key: "created_at",
      header: "Started",
      sortable: true,
      accessor: (run) => <span className="text-neutral-600">{formatRelativeTime(run.created_at)}</span>,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Agent Run History"
        breadcrumbs={[{ label: "Home", href: "/dashboard" }, { label: "AI Agents", href: "/ai-agents" }, { label: "Run History" }]}
        primaryAction={{ label: "Run demo", icon: Play, onClick: handleRunDemo }}
      />

      <DataTable
        columns={columns}
        data={filtered}
        getRowId={(run) => run.id}
        sort={sort}
        onSortChange={(key) =>
          setSort((prev) => ({ key, direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc" }))
        }
        filters={filters}
        onFilterChange={(key, value) => setFilters((prev) => ({ ...prev, [key]: value }))}
        hasMore={false}
        emptyState={
          hasActiveFilters ? (
            <EmptyState
              variant="filtered"
              message="No runs match your filters"
              ctaLabel="Clear filters"
              onCtaClick={() => setFilters({})}
            />
          ) : (
            <EmptyState
              variant="first-time"
              message="No agent runs yet — run an agent from Tickets, Deals, Analytics, or Knowledge Base."
              ctaLabel="Run demo"
              onCtaClick={handleRunDemo}
            />
          )
        }
      />

      <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-surface p-3 shadow-sm">
        <div className="text-sm text-neutral-600">
          <span className="font-medium text-neutral-950">{filtered.length}</span> run{filtered.length === 1 ? "" : "s"} shown
        </div>
        <Button variant="outline" size="sm" onClick={() => setFilters({})} disabled={!hasActiveFilters}>
          Reset filters
        </Button>
      </div>
    </div>
  );
}
