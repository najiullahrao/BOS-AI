export type BillingPlan = "free" | "pro" | "enterprise";
export type BillingStatus = "active" | "past_due";

export interface SeatsUsage {
  used: number;
  limit: number | null;
  label: string;
}

export interface LimitedUsage {
  used: number;
  limit: number;
}

export interface StorageUsage {
  used: number;
  limitMB: number;
  label: string;
}

export interface Subscription {
  plan: BillingPlan;
  status: BillingStatus;
  currentPeriodEnd: string;
  seats: SeatsUsage;
  aiAgentRuns: LimitedUsage;
  workflowRuns: LimitedUsage;
  kbStorageMB: StorageUsage;
}

export const mockSubscription: Subscription = {
  plan: "pro",
  status: "active",
  currentPeriodEnd: "2026-08-01",
  seats: { used: 6, limit: null, label: "Unlimited (per-seat billed)" },
  aiAgentRuns: { used: 812, limit: 1000 },
  workflowRuns: { used: 1450, limit: 2000 },
  kbStorageMB: { used: 3200, limitMB: 10240, label: "3.1 GB of 10 GB" },
};

export interface Invoice {
  id: string;
  date: string;
  amount: number;
  currency: string;
  status: "paid";
}

export const mockInvoices: Invoice[] = [
  { id: "inv_1", date: "2026-07-01", amount: 294.0, currency: "USD", status: "paid" },
  { id: "inv_2", date: "2026-06-01", amount: 294.0, currency: "USD", status: "paid" },
  { id: "inv_3", date: "2026-05-01", amount: 252.0, currency: "USD", status: "paid" },
];

export interface PlanComparisonRow {
  feature: string;
  free: string;
  pro: string;
  enterprise: string;
}

export const PLAN_COMPARISON: PlanComparisonRow[] = [
  { feature: "Seats", free: "3", pro: "Unlimited", enterprise: "Unlimited" },
  { feature: "AI Agent Runs/mo", free: "50", pro: "1,000", enterprise: "Custom" },
  { feature: "Workflow Runs/mo", free: "100", pro: "2,000", enterprise: "Custom" },
  { feature: "KB Storage", free: "100 MB", pro: "10 GB", enterprise: "Custom" },
  { feature: "Audit Log", free: "No", pro: "Yes", enterprise: "Yes" },
  { feature: "Admin Portal", free: "No", pro: "Partial", enterprise: "Full" },
];

export function formatBillingCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
}

/** Formats a date-only (YYYY-MM-DD) string in local time, avoiding UTC-shift off-by-one days. */
export function formatBillingDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(`${iso}T00:00:00`));
}

export function usagePercent(used: number, limit: number): number {
  if (limit <= 0) return 0;
  return (used / limit) * 100;
}

export function meterTone(percent: number): "success" | "warning" | "danger" {
  if (percent >= 100) return "danger";
  if (percent >= 80) return "warning";
  return "success";
}

