import type { StatusBadgeProps } from "@/components/shared/status-badge";
import { getContactFullName, mockContacts, mockLeads, type Contact, type Lead } from "@/lib/mock-crm";

export type TicketPriority = "urgent" | "high" | "medium" | "low";
export type TicketStatus = "open" | "pending" | "resolved" | "closed";
type BadgeVariant = NonNullable<StatusBadgeProps["variant"]>;

export interface Ticket {
  id: string;
  subject: string;
  contact: string;
  priority: TicketPriority;
  status: TicketStatus;
  sla_due_at: string;
  assignee: string | null;
}

export const mockTickets: Ticket[] = [
  { id: "tk_1", subject: "Unable to export report to CSV", contact: "Rosa Delgado", priority: "urgent", status: "open", sla_due_at: "2026-07-11T14:00:00Z", assignee: "Tom Baker" },
  { id: "tk_2", subject: "Question about seat billing", contact: "Ken Ishida", priority: "medium", status: "pending", sla_due_at: "2026-07-12T10:00:00Z", assignee: "Tom Baker" },
  { id: "tk_3", subject: "KB article link is broken", contact: "Marta Novak", priority: "low", status: "open", sla_due_at: "2026-07-14T09:00:00Z", assignee: null },
  { id: "tk_4", subject: "Integration webhook failing intermittently", contact: "Devon Price", priority: "high", status: "open", sla_due_at: "2026-07-11T11:00:00Z", assignee: "Tom Baker" },
  { id: "tk_5", subject: "Thanks — issue resolved on our end", contact: "Owen Fitzgerald", priority: "low", status: "resolved", sla_due_at: "2026-07-09T09:00:00Z", assignee: "Tom Baker" },
];

export const PRIORITY_LABELS: Record<TicketPriority, string> = { urgent: "Urgent", high: "High", medium: "Medium", low: "Low" };
export const PRIORITY_BADGE_VARIANT: Record<TicketPriority, BadgeVariant> = { urgent: "danger", high: "warning", medium: "info", low: "neutral" };

export const STATUS_LABELS: Record<TicketStatus, string> = { open: "Open", pending: "Pending", resolved: "Resolved", closed: "Closed" };
export const STATUS_BADGE_VARIANT: Record<TicketStatus, BadgeVariant> = { open: "info", pending: "warning", resolved: "success", closed: "neutral" };

// Fixed "now" per spec, used only for SLA urgency badges/sorting in this module.
export const TICKETS_NOW = new Date("2026-07-11T09:30:00Z");

export interface SlaBadge {
  label: string;
  variant: BadgeVariant;
  /** Ascending sort key — breached/soonest first, resolved/closed tickets sort last. */
  sortValue: number;
}

export function getSlaBadge(ticket: Ticket): SlaBadge {
  if (ticket.status === "resolved" || ticket.status === "closed") {
    return { label: ticket.status === "resolved" ? "Resolved" : "Closed", variant: "neutral", sortValue: Number.POSITIVE_INFINITY };
  }

  const diffMs = new Date(ticket.sla_due_at).getTime() - TICKETS_NOW.getTime();
  const diffHours = diffMs / 3_600_000;

  if (diffMs <= 0) {
    return { label: "Breached", variant: "danger", sortValue: diffMs };
  }
  if (diffHours <= 6) {
    return { label: `Due in ${Math.ceil(diffHours)}h`, variant: "danger", sortValue: diffMs };
  }
  if (diffHours <= 48) {
    const label = diffHours < 24 ? `Due in ${Math.ceil(diffHours)}h` : `Due in ${Math.ceil(diffHours / 24)}d`;
    return { label, variant: "warning", sortValue: diffMs };
  }
  return { label: `Due in ${Math.ceil(diffHours / 24)}d`, variant: "neutral", sortValue: diffMs };
}

export interface TicketComment {
  id: string;
  ticket_id: string;
  author: string;
  body: string;
  is_internal_note: boolean;
  created_at: string;
}

export const mockCommentsByTicket: Record<string, TicketComment[]> = {
  tk_1: [
    { id: "cm_1", ticket_id: "tk_1", author: "Rosa Delgado", body: "The export button just spins forever, nothing downloads. Using Chrome on Mac.", is_internal_note: false, created_at: "2026-07-11T08:10:00Z" },
    { id: "cm_2", ticket_id: "tk_1", author: "Tom Baker", body: "Checked logs — looks like it's timing out on large date ranges. Escalating priority.", is_internal_note: true, created_at: "2026-07-11T08:40:00Z" },
  ],
  tk_2: [
    { id: "cm_3", ticket_id: "tk_2", author: "Ken Ishida", body: "We just added 12 more seats — want to confirm the prorated charge will show up correctly on the next invoice.", is_internal_note: false, created_at: "2026-07-10T09:00:00Z" },
  ],
  tk_3: [
    { id: "cm_4", ticket_id: "tk_3", author: "Marta Novak", body: "The link to the 'Data Export Formats' article in your help center 404s.", is_internal_note: false, created_at: "2026-07-09T09:00:00Z" },
  ],
  tk_4: [
    { id: "cm_5", ticket_id: "tk_4", author: "Devon Price", body: "Our webhook receiver is getting duplicate and missing events randomly — seems worse during peak hours.", is_internal_note: false, created_at: "2026-07-10T16:00:00Z" },
    { id: "cm_6", ticket_id: "tk_4", author: "Tom Baker", body: "Reproduced intermittently in staging, looks related to retry backoff. Bumping priority.", is_internal_note: true, created_at: "2026-07-11T07:30:00Z" },
  ],
  tk_5: [
    { id: "cm_7", ticket_id: "tk_5", author: "Owen Fitzgerald", body: "Never mind, this resolved itself after we cleared our browser cache. Thanks for the quick look!", is_internal_note: false, created_at: "2026-07-09T08:30:00Z" },
  ],
};

export function getCommentsForTicket(ticketId: string): TicketComment[] {
  return mockCommentsByTicket[ticketId] ?? [];
}

export function getTicketCountForContact(contactName: string, excludeTicketId?: string): number {
  return mockTickets.filter((t) => t.contact === contactName && t.id !== excludeTicketId).length;
}

export interface LinkedCrmRecord {
  type: "contact" | "lead";
  contact?: Contact;
  lead?: Lead;
}

/** Ticket contacts are stored as plain name strings — resolve to the real CRM record instead of duplicating contact data. */
export function getCrmRecordForContactName(name: string): LinkedCrmRecord | null {
  const contact = mockContacts.find((c) => getContactFullName(c) === name);
  if (contact) return { type: "contact", contact };
  const lead = mockLeads.find((l) => l.contactName === name);
  if (lead) return { type: "lead", lead };
  return null;
}

export interface AiCitation {
  id: string;
  title: string;
  chunkPreview: string;
}

export type AiConfidence = "grounded" | "ungrounded";

export interface AiSuggestReply {
  draft: string;
  sources: AiCitation[];
  confidence: AiConfidence;
}

const mockSuggestReplyByTicket: Record<string, AiSuggestReply> = {
  tk_1: {
    draft:
      "Thanks for flagging this, Rosa — large date-range exports can time out during peak hours. As a workaround, try exporting in smaller monthly batches for now; I've also flagged this for our engineering team to raise the export timeout limit.",
    sources: [{ id: "kb_12", title: "Exporting Large Reports", chunkPreview: "Exports covering more than 90 days may time out during peak load..." }],
    confidence: "grounded",
  },
  tk_3: {
    draft:
      "Thanks for letting us know that link isn't working — sorry for the trouble. I don't have a specific replacement article on file yet, but I've flagged the broken link to our content team. In the meantime, let me know what topic you were looking for and I'll point you in the right direction directly.",
    sources: [],
    confidence: "ungrounded",
  },
};

const GENERIC_SUGGEST_REPLY: AiSuggestReply = {
  draft: "Thanks for reaching out — I'm looking into this now and will follow up as soon as I have an update.",
  sources: [],
  confidence: "ungrounded",
};

export function getMockSuggestReply(ticketId: string): AiSuggestReply {
  return mockSuggestReplyByTicket[ticketId] ?? GENERIC_SUGGEST_REPLY;
}

const mockSummaryByTicket: Record<string, string> = {
  tk_1: "Customer reports CSV export hangs indefinitely on large date ranges; likely a timeout issue, already escalated internally.",
};

export function getMockThreadSummary(ticketId: string): string {
  return mockSummaryByTicket[ticketId] ?? "Not enough conversation history yet to summarize this thread.";
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface FieldErrors {
  [field: string]: string | undefined;
}

export interface NewTicketInput {
  subject: string;
  contact: string;
  priority: TicketPriority;
  assignee: string | null;
}

const SLA_HOURS_BY_PRIORITY: Record<TicketPriority, number> = { urgent: 4, high: 8, medium: 24, low: 72 };

export async function mockCreateTicket(input: NewTicketInput): Promise<{ ok: true; ticket: Ticket } | { ok: false; errors: FieldErrors }> {
  await delay(500);
  const errors: FieldErrors = {};
  if (!input.subject.trim()) errors.subject = "Subject is required";
  if (!input.contact.trim()) errors.contact = "Select a contact";
  if (Object.keys(errors).length > 0) return { ok: false, errors };

  const dueMs = TICKETS_NOW.getTime() + SLA_HOURS_BY_PRIORITY[input.priority] * 3_600_000;
  return {
    ok: true,
    ticket: {
      id: `tk_${Math.random().toString(36).slice(2, 9)}`,
      subject: input.subject.trim(),
      contact: input.contact,
      priority: input.priority,
      status: "open",
      sla_due_at: new Date(dueMs).toISOString(),
      assignee: input.assignee,
    },
  };
}

export function getAllKnownContactNames(): string[] {
  const contactNames = mockContacts.map((c) => getContactFullName(c));
  const leadNames = mockLeads.map((l) => l.contactName);
  return Array.from(new Set([...contactNames, ...leadNames])).sort();
}
