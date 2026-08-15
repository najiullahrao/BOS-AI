"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUp, History, Sparkles } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PageHeader } from "@/components/shared/page-header";
import { AIPanel } from "@/components/shared/ai-panel";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/shared/toast";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { recordAgentRun } from "@/lib/mock-agent-runs";
import { formatCurrency } from "@/lib/mock-crm";
import { mockSession } from "@/lib/mock-data";
import {
  ANALYTICS_PERIODS,
  ANALYTICS_TAB_LABELS,
  getAnalyticsDataset,
  getVisibleAnalyticsTabs,
  type AnalyticsDataset,
  type AnalyticsPeriod,
  type AnalyticsTab,
  type PipelineFunnelPoint,
} from "@/lib/mock-analytics";

const ANALYST_INSIGHTS = `Key insights for this week:

· Ticket volume is up 18% week-over-week, driven by login timeouts — consider publishing the timeout workaround to the public knowledge base.
· SLA compliance is at 94%, above the 90% target.
· Acme Robotics is the largest open opportunity (negotiation stage).
· CSAT is stable at 4.2 out of 5.`;

const PRIMARY = "#3730a3";
const INFO = "#0E7490";
const FUNNEL_COLORS = ["rgba(55, 48, 163, 0.9)", "rgba(55, 48, 163, 0.65)", "rgba(55, 48, 163, 0.4)"];

function StatCard({ value, label, sub }: { value: string; label: string; sub?: React.ReactNode }) {
  return (
    <div className="rounded-md border border-border bg-surface p-4 shadow-sm">
      <p className="text-2xl font-semibold text-neutral-950">{value}</p>
      <p className="mt-1 text-sm text-neutral-600">{label}</p>
      {sub && <div className="mt-1 text-xs text-neutral-600">{sub}</div>}
    </div>
  );
}

function ChartCard({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function PipelineFunnelChart({ data }: { data: PipelineFunnelPoint[] }) {
  const maxCount = Math.max(...data.map((d) => d.count));
  const chartData = data.map((d) => ({ ...d, lead: (maxCount - d.count) / 2 }));

  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 16, top: 4, bottom: 4 }}>
          <YAxis type="category" dataKey="stage" width={80} axisLine={false} tickLine={false} fontSize={12} />
          <XAxis type="number" hide domain={[0, maxCount]} />
          <Tooltip
            cursor={{ fill: "rgba(0, 0, 0, 0.04)" }}
            formatter={(value, name) => {
              if (name === "lead") return [null, null] as unknown as [string, string];
              return [value, "Count"];
            }}
          />
          <Bar dataKey="lead" stackId="funnel" fill="transparent" isAnimationActive={false} />
          <Bar dataKey="count" stackId="funnel" radius={[4, 4, 4, 4]} isAnimationActive={false}>
            {data.map((point, i) => (
              <Cell key={point.stage} fill={FUNNEL_COLORS[i % FUNNEL_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function SalesDashboard({ data }: { data: AnalyticsDataset }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <ChartCard title="Pipeline funnel" description="Lead counts by pipeline stage.">
          <PipelineFunnelChart data={data.pipeline} />
        </ChartCard>
        <ChartCard title="Deal value by stage">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.dealValues} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e6eb" />
                <XAxis dataKey="stage" axisLine={false} tickLine={false} fontSize={12} />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  fontSize={12}
                  tickFormatter={(value) => `$${(Number(value) / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  cursor={{ fill: "rgba(0, 0, 0, 0.04)" }}
                  formatter={(value) => [formatCurrency(Number(value), "USD"), "Value"]}
                />
                <Bar dataKey="value" fill={PRIMARY} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <ChartCard title="Conversion rate trend" description="Weekly conversion, last 7 weeks.">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.conversionRate} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e6eb" />
                <XAxis dataKey="week" axisLine={false} tickLine={false} fontSize={12} interval="equidistantPreserveStart" minTickGap={24} />
                <YAxis axisLine={false} tickLine={false} fontSize={12} tickFormatter={(value) => `${value}%`} />
                <Tooltip formatter={(value) => [`${value}%`, "Conversion rate"]} />
                <Line type="monotone" dataKey="rate" stroke={PRIMARY} strokeWidth={2} dot={{ r: 3, fill: PRIMARY }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
        <div className="rounded-md border border-border bg-surface p-4 shadow-sm">
          <p className="text-3xl font-semibold text-neutral-950">{data.winRate}%</p>
          <p className="mt-1 text-sm text-neutral-600">Win rate</p>
        </div>
      </div>
    </div>
  );
}

function SupportDashboard({ data }: { data: AnalyticsDataset }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          value={`${data.slaCompliance.rate}%`}
          label="SLA compliance"
          sub={
            <span className="flex items-center gap-1 font-medium text-success">
              <ArrowUp className="size-3.5" aria-hidden="true" />
              up from {data.slaCompliance.previous}%
            </span>
          }
        />
        <StatCard value={`${data.avgFirstResponseHrs} hrs`} label="Avg first response" />
        <StatCard value={`${data.avgResolutionHrs} hrs`} label="Avg resolution time" />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <ChartCard title="Ticket volume trend" description="Tickets created per day.">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.ticketVolume} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e6eb" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} fontSize={11} interval="equidistantPreserveStart" minTickGap={16} />
                <YAxis axisLine={false} tickLine={false} fontSize={12} allowDecimals={false} />
                <Tooltip cursor={{ fill: "rgba(0, 0, 0, 0.04)" }} formatter={(value) => [value, "Tickets"]} />
                <Bar dataKey="count" fill={PRIMARY} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
        <ChartCard title="Tickets by priority">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.priorityBreakdown}
                  dataKey="count"
                  nameKey="priority"
                  innerRadius="58%"
                  outerRadius="82%"
                  paddingAngle={2}
                >
                  {data.priorityBreakdown.map((slice) => (
                    <Cell key={slice.priority} fill={slice.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [value, `${name} tickets`]} />
                <Legend verticalAlign="bottom" iconType="circle" iconSize={8} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>
    </div>
  );
}

function AiUsageDashboard({ data }: { data: AnalyticsDataset }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <ChartCard title="AI chat message volume" description="Internal vs customer-facing, per day.">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.aiMessages} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e6eb" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} fontSize={11} interval="equidistantPreserveStart" minTickGap={16} />
                <YAxis axisLine={false} tickLine={false} fontSize={12} allowDecimals={false} />
                <Tooltip cursor={{ fill: "rgba(0, 0, 0, 0.04)" }} />
                <Legend verticalAlign="top" iconType="circle" iconSize={8} />
                <Bar dataKey="internal" name="Internal" stackId="messages" fill={PRIMARY} />
                <Bar dataKey="customer" name="Customer-facing" stackId="messages" fill={INFO} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
        <ChartCard title="AI agent runs by type">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.agentRuns} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e6eb" />
                <XAxis dataKey="type" axisLine={false} tickLine={false} fontSize={12} />
                <YAxis axisLine={false} tickLine={false} fontSize={12} allowDecimals={false} />
                <Tooltip cursor={{ fill: "rgba(0, 0, 0, 0.04)" }} formatter={(value) => [value, "Runs"]} />
                <Bar dataKey="count" fill={PRIMARY} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>
      <ChartCard title="Top recurring customer questions">
        <ol className="flex flex-col divide-y divide-border">
          {data.topQuestions.map((item, index) => (
            <li key={item.question} className="flex items-center justify-between gap-3 py-2.5 text-sm">
              <span className="flex min-w-0 items-center gap-3">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-neutral-50 text-xs font-semibold text-neutral-600">
                  {index + 1}
                </span>
                <span className="min-w-0 truncate text-neutral-950">{item.question}</span>
              </span>
              <span className="shrink-0 text-xs text-neutral-600">{item.count} ask{item.count === 1 ? "" : "s"}</span>
            </li>
          ))}
        </ol>
      </ChartCard>
    </div>
  );
}

function TeamDashboard({ data }: { data: AnalyticsDataset }) {
  const columns: DataTableColumn<(typeof data.responseTimes)[number]>[] = [
    { key: "agent", header: "Agent", accessor: (row) => <span className="font-medium text-neutral-950">{row.agent}</span> },
    {
      key: "avgFirstResponseMins",
      header: "Avg first response",
      accessor: (row) =>
        row.avgFirstResponseMins == null ? (
          <span className="text-neutral-400">N/A</span>
        ) : (
          <span>{row.avgFirstResponseMins} min</span>
        ),
    },
    {
      key: "role",
      header: "Role",
      accessor: (row) => (
        <span className="font-mono text-xs text-neutral-600">{row.role.replace(/_/g, " ")}</span>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <ChartCard title="Team activity" description="Tickets resolved and deals closed per agent.">
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.teamActivity} margin={{ top: 4, right: 8, left: 8, bottom: 4 }} barGap={6}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e6eb" />
              <XAxis dataKey="agent" axisLine={false} tickLine={false} fontSize={12} />
              <YAxis axisLine={false} tickLine={false} fontSize={12} allowDecimals={false} />
              <Tooltip cursor={{ fill: "rgba(0, 0, 0, 0.04)" }} />
              <Legend verticalAlign="top" iconType="circle" iconSize={8} />
              <Bar dataKey="ticketsResolved" name="Tickets resolved" fill={PRIMARY} radius={[4, 4, 0, 0]} />
              <Bar dataKey="dealsClosed" name="Deals closed" fill={INFO} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      <Card>
        <CardHeader>
          <CardTitle>Response time</CardTitle>
          <CardDescription>Average first response time by team member.</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={data.responseTimes} getRowId={(row) => row.agent} hasMore={false} />
        </CardContent>
      </Card>
    </div>
  );
}

export default function AnalyticsPage() {
  const role = mockSession.user.role;
  const [state, setState] = useState<"thinking" | "default">("default");
  const [insight, setInsight] = useState<string | null>(null);
  const [period, setPeriod] = useState<AnalyticsPeriod>("7d");
  const [activeTab, setActiveTab] = useState<AnalyticsTab>("sales");
  const visibleTabs = getVisibleAnalyticsTabs(role);
  const dataset = getAnalyticsDataset(period);
  const emptyDataset = dataset.pipeline.length === 0 || dataset.ticketVolume.length === 0;

  async function handleAnalyze() {
    if (state === "thinking") return;
    setState("thinking");
    setInsight(null);
    await new Promise((resolve) => setTimeout(resolve, 900));
    setInsight(ANALYST_INSIGHTS);
    setState("default");
    recordAgentRun({ agent: "analyst", title: "Analyze weekly performance", status: "completed", duration_ms: 900 });
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Analytics"
        breadcrumbs={[{ label: "Home", href: "/dashboard" }, { label: "Analytics" }]}
        primaryAction={{ label: "Analyze", icon: Sparkles, onClick: handleAnalyze }}
      />

      <div className="flex flex-col gap-3 rounded-md border border-border bg-surface p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Sparkles className="size-4" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-neutral-950">Analyst Agent</h2>
              <p className="text-xs text-neutral-600">Turns performance data into plain-language insights.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge variant="neutral">{insight ? "Latest analysis ready" : "Idle"}</StatusBadge>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/ai-agents/runs?agent=analyst">
                <History className="size-3.5" />
                Run history
              </Link>
            </Button>
          </div>
        </div>

        {insight && (
          <AIPanel
            label="Weekly Analysis"
            state={state}
            content={<p className="whitespace-pre-wrap">{insight}</p>}
            onDiscard={() => setInsight(null)}
            onEdit={() => {
              navigator.clipboard?.writeText(insight).catch(() => {});
              toast.success("Analysis copied to clipboard");
            }}
            onInsert={() => {
              navigator.clipboard?.writeText(insight).catch(() => {});
              toast.success("Analysis copied to clipboard");
            }}
          />
        )}
      </div>

      {visibleTabs.length > 0 && (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium text-neutral-950">Period</span>
            <div className="flex items-center gap-1 rounded-md border border-border bg-neutral-50 p-1">
              {ANALYTICS_PERIODS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={period === option.value}
                  onClick={() => setPeriod(option.value)}
                  className={cn(
                    "rounded px-3 py-1 text-sm font-medium transition-colors",
                    period === option.value
                      ? "bg-surface text-neutral-950 shadow-sm"
                      : "text-neutral-600 hover:text-neutral-950"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {emptyDataset ? (
            <EmptyState
              variant="first-time"
              message="Not enough data yet - check back after your first week of activity."
              ctaLabel="Back to overview"
              onCtaClick={() => setPeriod("7d")}
            />
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-1 overflow-x-auto border-b border-border">
                {visibleTabs.map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    aria-selected={activeTab === tab}
                    role="tab"
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      "relative shrink-0 rounded-t-md px-3 py-1.5 text-sm font-medium transition-colors",
                      activeTab === tab
                        ? "text-neutral-950 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-foreground"
                        : "text-neutral-600 hover:text-neutral-950"
                    )}
                  >
                    {ANALYTICS_TAB_LABELS[tab]}
                  </button>
                ))}
              </div>

              {activeTab === "sales" && <SalesDashboard data={dataset} />}
              {activeTab === "support" && <SupportDashboard data={dataset} />}
              {activeTab === "ai-usage" && <AiUsageDashboard data={dataset} />}
              {activeTab === "team" && <TeamDashboard data={dataset} />}
            </div>
          )}
        </>
      )}
    </div>
  );
}
