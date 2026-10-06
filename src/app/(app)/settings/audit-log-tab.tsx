"use client";

import { useState } from "react";
import { Lock } from "lucide-react";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { Drawer } from "@/components/shared/drawer";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatDateTime } from "@/lib/mock-sessions";
import { getUserInitials } from "@/lib/mock-data";
import {
  auditActionLabel,
  auditEntityTypeLabel,
  getAuditActionFilterOptions,
  EMPTY_AUDIT_FILTERS,
  type AuditLogEntry,
  type AuditLogFilters,
} from "@/lib/mock-audit-log";

function SimulateFreeToggle({ value, onChange }: { value: boolean; onChange: (value: boolean) => void }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Audit log demo controls</CardTitle>
        <CardDescription>Preview the plan-gated state for audit log viewing.</CardDescription>
      </CardHeader>
      <CardContent className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium text-neutral-950">Simulate Free plan</span>
          <span className="text-xs text-neutral-600">Demo only. Shows the locked state free-plan accounts see.</span>
        </div>
        <Switch checked={value} onCheckedChange={onChange} aria-label="Simulate Free plan" />
      </CardContent>
    </Card>
  );
}

function LockedAuditLogCard({ onUpgrade }: { onUpgrade: () => void }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
        <span className="flex size-10 items-center justify-center rounded-full bg-neutral-100 text-neutral-600">
          <Lock className="size-5" aria-hidden="true" />
        </span>
        <p className="max-w-sm text-sm text-neutral-950">Audit log viewing is available on Pro and Enterprise plans.</p>
        <Button onClick={onUpgrade}>Upgrade to Pro</Button>
      </CardContent>
    </Card>
  );
}

function DiffValues({ value }: { value: Record<string, unknown> | null }) {
  if (!value) return null;
  const entries = Object.entries(value);
  if (entries.length === 0) return null;
  return (
    <dl className="flex flex-col gap-2">
      {entries.map(([key, val]) => (
        <div key={key} className="flex items-center justify-between gap-3 rounded-md border border-border bg-neutral-50 px-2.5 py-1.5">
          <dt className="text-xs font-medium text-neutral-600">{key}</dt>
          <dd className="font-mono text-xs text-neutral-950">{val === null ? "null" : String(val)}</dd>
        </div>
      ))}
    </dl>
  );
}

function DiffDrawer({ entry, onOpenChange }: { entry: AuditLogEntry | null; onOpenChange: (open: boolean) => void }) {
  const open = Boolean(entry);
  const entityLabel = entry ? `${auditEntityTypeLabel(entry.entityType)} ${entry.entityId ?? ""}`.trim() : undefined;
  return (
    <Drawer open={open} onOpenChange={onOpenChange} title="View diff" description={entityLabel}>
      {entry && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <section className="flex flex-col gap-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-600">Before</h3>
            {entry.before ? (
              <DiffValues value={entry.before} />
            ) : (
              <p className="text-sm italic text-neutral-400">Record did not exist</p>
            )}
          </section>
          <section className="flex flex-col gap-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-600">After</h3>
            {entry.after ? (
              <DiffValues value={entry.after} />
            ) : (
              <p className="text-sm italic text-neutral-400">Record deleted</p>
            )}
          </section>
        </div>
      )}
    </Drawer>
  );
}

export interface AuditLogTabContentProps {
  locked: boolean;
  entries: AuditLogEntry[];
  filters: AuditLogFilters;
  onFiltersChange: (filters: AuditLogFilters) => void;
  onSimulateFreeChange: (value: boolean) => void;
  onUpgrade: () => void;
}

export function AuditLogTabContent({
  locked,
  entries,
  filters,
  onFiltersChange,
  onSimulateFreeChange,
  onUpgrade,
}: AuditLogTabContentProps) {
  const [diffEntry, setDiffEntry] = useState<AuditLogEntry | null>(null);

  if (locked) {
    return (
      <div className="flex flex-col gap-6">
        <SimulateFreeToggle value={locked} onChange={onSimulateFreeChange} />
        <LockedAuditLogCard onUpgrade={onUpgrade} />
      </div>
    );
  }

  const columns: DataTableColumn<AuditLogEntry>[] = [
    {
      key: "createdAt",
      header: "Timestamp",
      accessor: (entry) => <span className="whitespace-nowrap">{formatDateTime(entry.createdAt)}</span>,
    },
    {
      key: "actor",
      header: "Actor",
      filterPlaceholder: "Search actor...",
      accessor: (entry) =>
        entry.actor ? (
          <div className="flex items-center gap-2">
            <Avatar size="sm">
              <AvatarFallback>{getUserInitials(entry.actor)}</AvatarFallback>
            </Avatar>
            <span className="font-medium text-neutral-950">{entry.actor}</span>
          </div>
        ) : (
          <span className="inline-flex items-center rounded-full border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-xs font-medium text-neutral-600">
            {entry.systemLabel ?? "System"}
          </span>
        ),
    },
    {
      key: "action",
      header: "Action",
      filterOptions: getAuditActionFilterOptions(entries),
      accessor: (entry) => auditActionLabel(entry.action),
    },
    {
      key: "entityType",
      header: "Entity Type",
      accessor: (entry) => <span className="text-neutral-600">{auditEntityTypeLabel(entry.entityType)}</span>,
    },
    {
      key: "diff",
      header: "Before/After",
      accessor: (entry) => (
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            setDiffEntry(entry);
          }}
        >
          View diff
        </Button>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <SimulateFreeToggle value={locked} onChange={onSimulateFreeChange} />

      <Card>
        <CardHeader>
          <CardTitle>Audit log</CardTitle>
          <CardDescription>Actions taken across this organization, in chronological order.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="audit-start-date">From</Label>
              <Input
                id="audit-start-date"
                type="date"
                value={filters.startDate}
                onChange={(e) => onFiltersChange({ ...filters, startDate: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="audit-end-date">To</Label>
              <Input
                id="audit-end-date"
                type="date"
                value={filters.endDate}
                onChange={(e) => onFiltersChange({ ...filters, endDate: e.target.value })}
              />
            </div>
          </div>

          <DataTable
            columns={columns}
            data={entries}
            getRowId={(entry) => entry.id}
            filters={filters as unknown as Record<string, string>}
            onFilterChange={(key, value) => onFiltersChange({ ...filters, [key]: value })}
            hasMore={false}
            emptyState={
              <EmptyState
                variant="filtered"
                message="No audit log entries match your filters."
                ctaLabel="Clear filters"
                onCtaClick={() => onFiltersChange(EMPTY_AUDIT_FILTERS)}
              />
            }
          />
        </CardContent>
      </Card>

      <DiffDrawer entry={diffEntry} onOpenChange={(open) => !open && setDiffEntry(null)} />
    </div>
  );
}
