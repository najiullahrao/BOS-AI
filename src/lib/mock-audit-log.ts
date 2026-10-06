export interface AuditLogEntry {
  id: string;
  actor: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  ip: string | null;
  createdAt: string;
  /** Shown in place of an actor name for system-originated entries (null actor). */
  systemLabel?: string;
}

// Before/after payloads must never contain password, MFA secret, or payment
// card fields. This is a hard rule for every entry in this dataset.
export const mockAuditLogEntries: AuditLogEntry[] = [
  {
    id: "al_1",
    actor: "Amara Chen",
    action: "team.change_role",
    entityType: "organization_members",
    entityId: "u_004",
    before: { role: "employee" },
    after: { role: "support_agent" },
    ip: "203.0.113.42",
    createdAt: "2026-07-10T10:15:00Z",
  },
  {
    id: "al_2",
    actor: "Diego Ramirez",
    action: "crm.delete",
    entityType: "companies",
    entityId: "co_9",
    before: { name: "Old Prospect LLC" },
    after: null,
    ip: "198.51.100.7",
    createdAt: "2026-07-09T16:02:00Z",
  },
  {
    id: "al_3",
    actor: null,
    action: "admin_cross_tenant_access",
    entityType: "organizations",
    entityId: "org_002",
    before: null,
    after: null,
    ip: "10.0.0.4",
    createdAt: "2026-07-08T09:30:00Z",
    systemLabel: "System (Platform Admin: impersonation)",
  },
  {
    id: "al_4",
    actor: "Amara Chen",
    action: "billing.change_plan",
    entityType: "subscriptions",
    entityId: "sub_1",
    before: { plan: "free" },
    after: { plan: "pro" },
    ip: "203.0.113.42",
    createdAt: "2026-06-01T12:00:00Z",
  },
  {
    id: "al_5",
    actor: null,
    action: "crm.bulk_delete",
    entityType: "contacts",
    entityId: null,
    before: null,
    after: { count: 12, ids: ["ct_101", "ct_102", "ct_103"] },
    ip: null,
    createdAt: "2026-07-07T14:20:00Z",
    systemLabel: "System (Workflow: Data cleanup)",
  },
];

export const AUDIT_ACTION_LABELS: Record<string, string> = {
  "team.change_role": "Changed member role",
  "crm.delete": "Deleted record",
  admin_cross_tenant_access: "Cross-tenant access",
  "billing.change_plan": "Changed plan",
  "crm.bulk_delete": "Bulk deleted records",
};

export const AUDIT_ENTITY_LABELS: Record<string, string> = {
  organization_members: "Organization member",
  companies: "Company",
  organizations: "Organization",
  subscriptions: "Subscription",
  contacts: "Contact",
};

export function auditActionLabel(action: string): string {
  return AUDIT_ACTION_LABELS[action] ?? action.replace(/_/g, " ");
}

export function auditEntityTypeLabel(entityType: string): string {
  return AUDIT_ENTITY_LABELS[entityType] ?? entityType.replace(/_/g, " ");
}

export function getAuditActionFilterOptions(entries: AuditLogEntry[]): { label: string; value: string }[] {
  const actions = [...new Set(entries.map((entry) => entry.action))];
  return actions.map((action) => ({ label: auditActionLabel(action), value: action }));
}

export interface AuditLogFilters {
  actor: string;
  action: string;
  startDate: string;
  endDate: string;
}

export const EMPTY_AUDIT_FILTERS: AuditLogFilters = { actor: "", action: "", startDate: "", endDate: "" };

function entryDate(entry: AuditLogEntry): string {
  return entry.createdAt.slice(0, 10);
}

export function filterAuditLog(entries: AuditLogEntry[], filters: AuditLogFilters): AuditLogEntry[] {
  const actorQuery = filters.actor.trim().toLowerCase();
  return entries.filter((entry) => {
    const actorText = (entry.actor ?? entry.systemLabel ?? "System").toLowerCase();
    const matchesActor = !actorQuery || actorText.includes(actorQuery);
    const matchesAction = !filters.action || entry.action === filters.action;
    const matchesStart = !filters.startDate || entryDate(entry) >= filters.startDate;
    const matchesEnd = !filters.endDate || entryDate(entry) <= filters.endDate;
    return matchesActor && matchesAction && matchesStart && matchesEnd;
  });
}

function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function exportAuditLogCsv(entries: AuditLogEntry[]): void {
  const header = ["ID", "Timestamp", "Actor", "Action", "Entity Type", "Entity ID", "Before", "After", "IP"];
  const rows = entries.map((entry) => [
    entry.id,
    entry.createdAt,
    entry.actor ?? entry.systemLabel ?? "System",
    auditActionLabel(entry.action),
    auditEntityTypeLabel(entry.entityType),
    entry.entityId ?? "",
    entry.before ? JSON.stringify(entry.before) : "",
    entry.after ? JSON.stringify(entry.after) : "",
    entry.ip ?? "",
  ]);
  const csv = [header, ...rows].map((row) => row.map(csvEscape).join(",")).join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
