import { mockAuditLogEntries } from "@/lib/mock-audit-log";
import { mockTeamMembers } from "@/lib/mock-team";

export type AdminOrgPlan = "free" | "pro" | "enterprise";
export type AdminOrgStatus = "active" | "suspended" | "past_due" | "deleted_pending_purge";

export interface AdminOrganization {
  id: string;
  name: string;
  plan: AdminOrgPlan;
  createdAt: string;
  seatCount: number;
  status: AdminOrgStatus;
}

export const mockAdminOrgs: AdminOrganization[] = [
  { id: "org_001", name: "Northlight Agency", plan: "pro", createdAt: "2026-03-01", seatCount: 6, status: "active" },
  { id: "org_002", name: "Northlight Agency Sandbox", plan: "free", createdAt: "2026-03-01", seatCount: 2, status: "active" },
  { id: "org_003", name: "Coastal Design Studio", plan: "enterprise", createdAt: "2026-01-14", seatCount: 28, status: "active" },
  { id: "org_004", name: "Riverbend Consulting", plan: "pro", createdAt: "2026-05-20", seatCount: 4, status: "past_due" },
  { id: "org_005", name: "ShellCo Test Account", plan: "free", createdAt: "2026-02-02", seatCount: 1, status: "suspended" },
];

export const ORG_PLAN_BADGE: Record<AdminOrgPlan, "neutral" | "info" | "success"> = {
  free: "neutral",
  pro: "info",
  enterprise: "success",
};

export const ORG_STATUS_BADGE: Record<AdminOrgStatus, "success" | "danger" | "warning" | "neutral"> = {
  active: "success",
  suspended: "danger",
  past_due: "warning",
  deleted_pending_purge: "neutral",
};

let orgsState = mockAdminOrgs.map((org) => ({ ...org }));
const orgListeners = new Set<() => void>();

export function subscribeAdminOrgs(listener: () => void): () => void {
  orgListeners.add(listener);
  return () => orgListeners.delete(listener);
}

export function getAdminOrgsSnapshot(): AdminOrganization[] {
  return orgsState;
}

export function setOrgStatus(orgId: string, status: AdminOrgStatus): void {
  orgsState = orgsState.map((org) => (org.id === orgId ? { ...org, status } : org));
  orgListeners.forEach((listener) => listener());
}

export interface OrgUsageStats {
  seats: number;
  aiRuns: number;
  workflowRuns: number;
  kbStorage: string;
}

export const ORG_USAGE_STATS: Record<string, OrgUsageStats> = {
  org_001: { seats: 6, aiRuns: 234, workflowRuns: 89, kbStorage: "3.1 GB" },
  org_002: { seats: 2, aiRuns: 18, workflowRuns: 6, kbStorage: "0.2 GB" },
  org_003: { seats: 28, aiRuns: 812, workflowRuns: 410, kbStorage: "12.4 GB" },
  org_004: { seats: 4, aiRuns: 61, workflowRuns: 22, kbStorage: "0.8 GB" },
  org_005: { seats: 1, aiRuns: 0, workflowRuns: 0, kbStorage: "0.1 GB" },
};

export interface AdminOrgMember {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
}

const ORG_STUB_MEMBERS: Record<string, AdminOrgMember[]> = {
  org_002: [
    { id: "u_001", name: "Amara Chen", email: "amara@northlightagency.com", role: "admin", status: "active" },
    { id: "u_002", name: "Diego Ramirez", email: "diego@northlightagency.com", role: "admin", status: "active" },
  ],
  org_003: [
    { id: "u_010", name: "Sofia Reyes", email: "sofia@coastaldesign.com", role: "owner", status: "active" },
    { id: "u_011", name: "Marcus Lee", email: "marcus@coastaldesign.com", role: "admin", status: "active" },
  ],
  org_004: [
    { id: "u_020", name: "Hannah Kim", email: "hannah@riverbend.com", role: "owner", status: "active" },
    { id: "u_021", name: "Omar Farouk", email: "omar@riverbend.com", role: "employee", status: "active" },
  ],
  org_005: [{ id: "u_030", name: "Test Shell User", email: "shell@shellco.test", role: "owner", status: "suspended" }],
};

export function getOrgMembers(orgId: string): AdminOrgMember[] {
  if (orgId === "org_001") {
    return mockTeamMembers.map(({ id, name, email, role, status }) => ({ id, name, email, role, status }));
  }
  return ORG_STUB_MEMBERS[orgId] ?? [];
}

export function getRecentAuditLog(): typeof mockAuditLogEntries {
  return mockAuditLogEntries.slice(0, 3);
}

export interface PlanDistributionSlice {
  plan: string;
  count: number;
}

export interface PlatformMetrics {
  totalOrgs: number;
  activeOrgs: number;
  planDistribution: PlanDistributionSlice[];
  totalAgentRunsToday: number;
  avgOllamaLatencyMs: number;
  queueDepth: number;
  queueFailureRate: string;
}

export const platformMetrics: PlatformMetrics = {
  totalOrgs: 47,
  activeOrgs: 41,
  planDistribution: [
    { plan: "Free", count: 22 },
    { plan: "Pro", count: 20 },
    { plan: "Enterprise", count: 5 },
  ],
  totalAgentRunsToday: 312,
  avgOllamaLatencyMs: 1840,
  queueDepth: 6,
  queueFailureRate: "1.2%",
};

export interface FeatureFlag {
  id: string;
  key: string;
  description: string;
  isGlobalEnabled: boolean;
  rolloutPercentage: number;
  enabledOrgIds: string[];
}

export const mockFeatureFlags: FeatureFlag[] = [
  {
    id: "ff_1",
    key: "workflow_branching_beta",
    description: "Enables conditional branching logic in the workflow builder (Phase 2 preview)",
    isGlobalEnabled: false,
    rolloutPercentage: 0,
    enabledOrgIds: ["org_003"],
  },
  {
    id: "ff_2",
    key: "cross_encoder_rerank",
    description: "Enables cross-encoder re-ranking for RAG retrieval",
    isGlobalEnabled: false,
    rolloutPercentage: 10,
    enabledOrgIds: [],
  },
];

let flagsState = mockFeatureFlags.map((flag) => ({ ...flag, enabledOrgIds: [...flag.enabledOrgIds] }));
const flagListeners = new Set<() => void>();

export function subscribeFeatureFlags(listener: () => void): () => void {
  flagListeners.add(listener);
  return () => flagListeners.delete(listener);
}

export function getFeatureFlagsSnapshot(): FeatureFlag[] {
  return flagsState;
}

export function toggleFeatureFlagGlobalEnabled(flagId: string): void {
  flagsState = flagsState.map((flag) => (flag.id === flagId ? { ...flag, isGlobalEnabled: !flag.isGlobalEnabled } : flag));
  flagListeners.forEach((listener) => listener());
}

export function addFeatureFlag(input: {
  key: string;
  description: string;
  isGlobalEnabled: boolean;
  rolloutPercentage: number;
}): void {
  const flag: FeatureFlag = {
    id: `ff_${Date.now().toString(36)}`,
    key: input.key,
    description: input.description,
    isGlobalEnabled: input.isGlobalEnabled,
    rolloutPercentage: input.rolloutPercentage,
    enabledOrgIds: [],
  };
  flagsState = [...flagsState, flag];
  flagListeners.forEach((listener) => listener());
}

export interface UserSearchResult {
  id: string;
  name: string;
  email: string;
  orgs: { name: string; role: string }[];
}

export const mockUserSearchResults: UserSearchResult[] = [
  {
    id: "u_001",
    name: "Amara Chen",
    email: "amara@northlightagency.com",
    orgs: [
      { name: "Northlight Agency", role: "owner" },
      { name: "Northlight Agency Sandbox", role: "admin" },
    ],
  },
];

export function searchUsers(query: string): UserSearchResult[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return mockUserSearchResults.filter((user) => {
    return (
      user.name.toLowerCase().includes(q) ||
      user.email.toLowerCase().includes(q) ||
      user.orgs.some((org) => org.name.toLowerCase().includes(q))
    );
  });
}

export const IMPERSONATION_SESSION_SECONDS = 30 * 60;

export function impersonationDurationLabel(seconds: number): string {
  if (seconds >= 60 && seconds % 60 === 0) {
    return `${seconds / 60} minutes`;
  }
  return `${seconds} seconds`;
}
