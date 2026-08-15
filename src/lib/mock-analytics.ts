import type { UserRole } from "@/lib/mock-data";

export type AnalyticsPeriod = "7d" | "30d" | "90d";

export interface PipelineFunnelPoint {
  stage: string;
  count: number;
}

export interface DealValuePoint {
  stage: string;
  value: number;
}

export interface ConversionPoint {
  week: string;
  rate: number;
}

export interface TicketVolumePoint {
  date: string;
  count: number;
}

export interface PrioritySlice {
  priority: string;
  count: number;
  color: string;
}

export interface AiMessagePoint {
  date: string;
  internal: number;
  customer: number;
}

export interface AgentRunPoint {
  type: string;
  count: number;
}

export interface RecurringQuestion {
  question: string;
  count: number;
}

export interface ProductivityPoint {
  agent: string;
  ticketsResolved: number;
  dealsClosed: number;
}

export interface ResponseTimeRow {
  agent: string;
  avgFirstResponseMins: number | null;
  role: string;
}

export interface SlaCompliance {
  rate: number;
  previous: number;
}

export interface AnalyticsDataset {
  pipeline: PipelineFunnelPoint[];
  dealValues: DealValuePoint[];
  conversionRate: ConversionPoint[];
  winRate: number;
  ticketVolume: TicketVolumePoint[];
  slaCompliance: SlaCompliance;
  avgFirstResponseHrs: number;
  avgResolutionHrs: number;
  priorityBreakdown: PrioritySlice[];
  aiMessages: AiMessagePoint[];
  agentRuns: AgentRunPoint[];
  topQuestions: RecurringQuestion[];
  teamActivity: ProductivityPoint[];
  responseTimes: ResponseTimeRow[];
}

const BASE_7D: AnalyticsDataset = {
  pipeline: [
    { stage: "Leads", count: 42 },
    { stage: "Qualified", count: 26 },
    { stage: "Converted", count: 11 },
  ],
  dealValues: [
    { stage: "Qualification", value: 24500 },
    { stage: "Proposal", value: 42000 },
    { stage: "Negotiation", value: 108000 },
    { stage: "Closed Won", value: 63000 },
  ],
  conversionRate: [
    { week: "W1", rate: 18 },
    { week: "W2", rate: 21 },
    { week: "W3", rate: 19 },
    { week: "W4", rate: 24 },
    { week: "W5", rate: 22 },
    { week: "W6", rate: 27 },
    { week: "W7", rate: 26 },
  ],
  winRate: 26,
  ticketVolume: [
    { date: "Jul 5", count: 11 },
    { date: "Jul 6", count: 8 },
    { date: "Jul 7", count: 14 },
    { date: "Jul 8", count: 9 },
    { date: "Jul 9", count: 12 },
    { date: "Jul 10", count: 15 },
    { date: "Jul 11", count: 7 },
  ],
  slaCompliance: { rate: 91.4, previous: 88.2 },
  avgFirstResponseHrs: 2.4,
  avgResolutionHrs: 18.2,
  priorityBreakdown: [
    { priority: "Urgent", count: 4, color: "#B91C1C" },
    { priority: "High", count: 12, color: "#B45309" },
    { priority: "Medium", count: 28, color: "#0E7490" },
    { priority: "Low", count: 19, color: "#5B6270" },
  ],
  aiMessages: [
    { date: "Jul 5", internal: 14, customer: 8 },
    { date: "Jul 6", internal: 11, customer: 12 },
    { date: "Jul 7", internal: 18, customer: 6 },
    { date: "Jul 8", internal: 9, customer: 15 },
    { date: "Jul 9", internal: 16, customer: 9 },
    { date: "Jul 10", internal: 22, customer: 11 },
    { date: "Jul 11", internal: 13, customer: 7 },
  ],
  agentRuns: [
    { type: "Support", count: 34 },
    { type: "Sales", count: 21 },
    { type: "Analyst", count: 4 },
    { type: "Content", count: 9 },
  ],
  topQuestions: [
    { question: "How do I export a report?", count: 14 },
    { question: "What is included in the Pro plan?", count: 9 },
    { question: "Do you offer refunds?", count: 6 },
  ],
  teamActivity: [
    { agent: "Tom Baker", ticketsResolved: 22, dealsClosed: 0 },
    { agent: "Elena Kowalski", ticketsResolved: 0, dealsClosed: 3 },
    { agent: "Priya Nair", ticketsResolved: 8, dealsClosed: 1 },
  ],
  responseTimes: [
    { agent: "Tom Baker", avgFirstResponseMins: 38, role: "support_agent" },
    { agent: "Elena Kowalski", avgFirstResponseMins: null, role: "sales_agent" },
    { agent: "Priya Nair", avgFirstResponseMins: 52, role: "manager" },
  ],
};

const TICKET_DATES_30D = Array.from({ length: 30 }, (_, i) => {
  const date = new Date(2026, 5, 12 + i);
  return `${date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
});

const TICKET_DATES_90D = Array.from({ length: 90 }, (_, i) => {
  const date = new Date(2026, 3, 13 + i);
  return `${date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
});

function periodicCount(i: number, base: number): number {
  return base + Math.round(Math.sin(i * 1.7) * 4) + (i % 3);
}

function ticketVolume(period: "30d" | "90d"): TicketVolumePoint[] {
  const dates = period === "30d" ? TICKET_DATES_30D : TICKET_DATES_90D;
  return dates.map((date, i) => ({ date, count: Math.max(1, periodicCount(i, period === "30d" ? 10 : 9)) }));
}

function aiMessages(period: "30d" | "90d"): AiMessagePoint[] {
  const dates = period === "30d" ? TICKET_DATES_30D : TICKET_DATES_90D;
  return dates.map((date, i) => ({
    date,
    internal: Math.max(1, periodicCount(i, 15)),
    customer: Math.max(1, periodicCount(i + 3, 9)),
  }));
}

function conversionRate(period: "30d" | "90d"): ConversionPoint[] {
  const weeks = period === "30d" ? 30 : 90;
  return Array.from({ length: weeks }, (_, i) => ({
    week: `W${i + 1}`,
    rate: 18 + ((i * 3 + i % 5) % 10) + Math.round(Math.sin(i * 1.3) * 2),
  }));
}

const DATASETS: Record<AnalyticsPeriod, AnalyticsDataset> = {
  "7d": BASE_7D,
  "30d": {
    ...BASE_7D,
    ticketVolume: ticketVolume("30d"),
    conversionRate: conversionRate("30d").slice(0, 30),
    aiMessages: aiMessages("30d"),
  },
  "90d": {
    ...BASE_7D,
    ticketVolume: ticketVolume("90d"),
    conversionRate: conversionRate("90d"),
    aiMessages: aiMessages("90d"),
  },
};

export function getAnalyticsDataset(period: AnalyticsPeriod): AnalyticsDataset {
  return DATASETS[period];
}

export const ANALYTICS_PERIODS: { value: AnalyticsPeriod; label: string }[] = [
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
];

export type AnalyticsTab = "sales" | "support" | "ai-usage" | "team";

const TAB_ROLES: Record<AnalyticsTab, UserRole[]> = {
  sales: ["manager", "admin", "owner"],
  support: ["manager", "admin", "owner"],
  "ai-usage": ["admin", "owner"],
  team: ["manager", "admin", "owner"],
};

export const ANALYTICS_TAB_LABELS: Record<AnalyticsTab, string> = {
  sales: "Sales",
  support: "Support",
  "ai-usage": "AI Usage",
  team: "Team Productivity",
};

export function getVisibleAnalyticsTabs(role: UserRole): AnalyticsTab[] {
  return (Object.keys(TAB_ROLES) as AnalyticsTab[]).filter((tab) => TAB_ROLES[tab].includes(role));
}
