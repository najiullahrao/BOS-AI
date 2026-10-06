"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { platformMetrics } from "@/lib/mock-admin";

const PLAN_COLORS: Record<string, string> = {
  Free: "#0e7490",
  Pro: "#3730a3",
  Enterprise: "#15803d",
};

function StatCard({ value, label, sub }: { value: string; label: string; sub?: string }) {
  return (
    <div className="rounded-md border border-border bg-surface p-4 shadow-sm">
      <p className="text-2xl font-semibold text-neutral-950">{value}</p>
      <p className="mt-1 text-sm text-neutral-600">{label}</p>
      {sub && <p className="mt-0.5 text-xs text-neutral-600">{sub}</p>}
    </div>
  );
}

export default function AdminMetricsPage() {
  const distribution = platformMetrics.planDistribution;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Platform Metrics"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Admin Portal", href: "/admin" },
          { label: "Platform Metrics" },
        ]}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard value={String(platformMetrics.totalOrgs)} label="Total organizations" />
        <StatCard value={String(platformMetrics.activeOrgs)} label="Active organizations" sub="Currently non-suspended" />
        <StatCard value={String(platformMetrics.totalAgentRunsToday)} label="Agent runs today" />
        <StatCard value={`${platformMetrics.avgOllamaLatencyMs} ms`} label="Avg Ollama latency" />
        <StatCard value={String(platformMetrics.queueDepth)} label="Queue depth" sub="Items awaiting processing" />
        <StatCard value={platformMetrics.queueFailureRate} label="Queue failure rate" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Plan distribution</CardTitle>
          <CardDescription>Organizations by subscription plan.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={distribution}
                  dataKey="count"
                  nameKey="plan"
                  innerRadius="58%"
                  outerRadius="82%"
                  paddingAngle={2}
                >
                  {distribution.map((slice) => (
                    <Cell key={slice.plan} fill={PLAN_COLORS[slice.plan] ?? "#3730a3"} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [value, `${name} orgs`]} />
                <Legend verticalAlign="bottom" iconType="circle" iconSize={8} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}