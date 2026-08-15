"use client";

import { useState } from "react";
import Link from "next/link";
import { History, Info, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { AIPanel } from "@/components/shared/ai-panel";
import { StatusBadge } from "@/components/shared/status-badge";
import { toast } from "@/components/shared/toast";
import { Button } from "@/components/ui/button";
import { recordAgentRun } from "@/lib/mock-agent-runs";

const ANALYST_INSIGHTS = `Key insights for this week:

· Ticket volume is up 18% week-over-week, driven by login timeouts — consider publishing the timeout workaround to the public knowledge base.
· SLA compliance is at 94%, above the 90% target.
· Acme Robotics is the largest open opportunity (negotiation stage).
· CSAT is stable at 4.2 out of 5.`;

export default function AnalyticsPage() {
  const [state, setState] = useState<"thinking" | "default">("default");
  const [insight, setInsight] = useState<string | null>(null);

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

        {insight ? (
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
        ) : (
          <div className="flex items-start gap-2 rounded-md border border-dashed border-neutral-200 px-3 py-4 text-sm text-neutral-600">
            <Info className="mt-0.5 size-4 shrink-0 text-neutral-600" aria-hidden="true" />
            <p>
              Run the Analyst Agent to summarize this week&apos;s performance. Full dashboard charts are coming in a
              later milestone.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
