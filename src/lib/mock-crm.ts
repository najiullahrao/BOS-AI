import { isValidEmail } from "@/lib/validation";

export interface Company {
  id: string;
  name: string;
  domain: string;
  industry: string;
  size_range: string;
  contactCount: number;
  dealCount: number;
  assignedTo: string;
  createdAt: string;
}

export type ContactSource = "referral" | "website_form" | "cold_outreach" | "event" | "other";

export const CONTACT_SOURCES: ContactSource[] = ["referral", "website_form", "cold_outreach", "event", "other"];

export const SOURCE_LABELS: Record<ContactSource, string> = {
  referral: "Referral",
  website_form: "Website form",
  cold_outreach: "Cold outreach",
  event: "Event",
  other: "Other",
};

export interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  title: string;
  company: string;
  source: ContactSource;
  assignedTo: string;
  createdAt: string;
}

export type LeadStatus = "new" | "contacted" | "qualified" | "unqualified" | "converted";

export interface Lead {
  id: string;
  contactName: string;
  status: LeadStatus;
  score: number | null;
  source: ContactSource;
  assignedTo: string;
}

export const mockCompanies: Company[] = [
  { id: "co_1", name: "Acme Robotics", domain: "acmerobotics.io", industry: "Manufacturing", size_range: "51-200", contactCount: 4, dealCount: 2, assignedTo: "Elena Kowalski", createdAt: "2026-05-02T10:00:00Z" },
  { id: "co_2", name: "Bluepeak Financial", domain: "bluepeak.com", industry: "Financial Services", size_range: "11-50", contactCount: 2, dealCount: 1, assignedTo: "Elena Kowalski", createdAt: "2026-05-14T10:00:00Z" },
  { id: "co_3", name: "Verdant Foods Co.", domain: "verdantfoods.com", industry: "Food & Beverage", size_range: "201-500", contactCount: 3, dealCount: 3, assignedTo: "Elena Kowalski", createdAt: "2026-04-28T10:00:00Z" },
  { id: "co_4", name: "Harborline Logistics", domain: "harborline.co", industry: "Logistics", size_range: "11-50", contactCount: 1, dealCount: 0, assignedTo: "Elena Kowalski", createdAt: "2026-06-01T10:00:00Z" },
];

export const mockContacts: Contact[] = [
  { id: "ct_1", first_name: "Rosa", last_name: "Delgado", email: "rosa.delgado@acmerobotics.io", phone: "+1-312-555-0148", title: "VP Operations", company: "Acme Robotics", source: "referral", assignedTo: "Elena Kowalski", createdAt: "2026-06-15T09:00:00Z" },
  { id: "ct_5", first_name: "Priya", last_name: "Anand", email: "priya.anand@acmerobotics.io", phone: "+1-312-555-0161", title: "Head of Procurement", company: "Acme Robotics", source: "website_form", assignedTo: "Elena Kowalski", createdAt: "2026-06-16T09:00:00Z" },
  { id: "ct_6", first_name: "Marcus", last_name: "Webb", email: "marcus.webb@acmerobotics.io", phone: "+1-312-555-0177", title: "Plant Manager", company: "Acme Robotics", source: "cold_outreach", assignedTo: "Elena Kowalski", createdAt: "2026-06-18T09:00:00Z" },
  { id: "ct_7", first_name: "Sofia", last_name: "Reyes", email: "sofia.reyes@acmerobotics.io", phone: "+1-312-555-0193", title: "Finance Director", company: "Acme Robotics", source: "referral", assignedTo: "Elena Kowalski", createdAt: "2026-06-20T09:00:00Z" },
  { id: "ct_2", first_name: "Ken", last_name: "Ishida", email: "ken.ishida@bluepeak.com", phone: "+1-212-555-0199", title: "Director of IT", company: "Bluepeak Financial", source: "website_form", assignedTo: "Elena Kowalski", createdAt: "2026-05-20T09:00:00Z" },
  { id: "ct_8", first_name: "Grace", last_name: "Lin", email: "grace.lin@bluepeak.com", phone: "+1-212-555-0142", title: "VP Compliance", company: "Bluepeak Financial", source: "event", assignedTo: "Elena Kowalski", createdAt: "2026-05-22T09:00:00Z" },
  { id: "ct_3", first_name: "Marta", last_name: "Novak", email: "marta.novak@verdantfoods.com", phone: "+1-773-555-0122", title: "COO", company: "Verdant Foods Co.", source: "event", assignedTo: "Elena Kowalski", createdAt: "2026-05-05T09:00:00Z" },
  { id: "ct_9", first_name: "Tomas", last_name: "Reyes", email: "tomas.reyes@verdantfoods.com", phone: "+1-773-555-0155", title: "Plant Operations Lead", company: "Verdant Foods Co.", source: "referral", assignedTo: "Elena Kowalski", createdAt: "2026-05-08T09:00:00Z" },
  { id: "ct_10", first_name: "Aisha", last_name: "Bello", email: "aisha.bello@verdantfoods.com", phone: "+1-773-555-0168", title: "Head of Procurement", company: "Verdant Foods Co.", source: "website_form", assignedTo: "Elena Kowalski", createdAt: "2026-05-11T09:00:00Z" },
  { id: "ct_4", first_name: "Devon", last_name: "Price", email: "devon.price@harborline.co", phone: null, title: "Founder", company: "Harborline Logistics", source: "cold_outreach", assignedTo: "Elena Kowalski", createdAt: "2026-06-03T09:00:00Z" },
];

export const mockLeads: Lead[] = [
  { id: "ld_1", contactName: "Priya Shah", status: "new", score: null, source: "website_form", assignedTo: "Elena Kowalski" },
  { id: "ld_2", contactName: "Owen Fitzgerald", status: "contacted", score: 62, source: "referral", assignedTo: "Elena Kowalski" },
  { id: "ld_3", contactName: "Ling Zhou", status: "qualified", score: 88, source: "event", assignedTo: "Elena Kowalski" },
  { id: "ld_4", contactName: "Bea Almeida", status: "unqualified", score: 20, source: "cold_outreach", assignedTo: "Elena Kowalski" },
];

export type PipelineStage = "qualification" | "proposal" | "negotiation" | "closed_won" | "closed_lost";
export type DealStatus = "open" | "won" | "lost";

export const PIPELINE_STAGE_ORDER: PipelineStage[] = ["qualification", "proposal", "negotiation", "closed_won", "closed_lost"];

export const PIPELINE_STAGE_LABELS: Record<PipelineStage, string> = {
  qualification: "Qualification",
  proposal: "Proposal",
  negotiation: "Negotiation",
  closed_won: "Closed Won",
  closed_lost: "Closed Lost",
};

export interface Deal {
  id: string;
  name: string;
  company: string;
  contact_id: string;
  amount: number;
  currency: string;
  pipeline_stage: PipelineStage;
  assignedTo: string;
  expected_close_date: string;
  status: DealStatus;
}

export const mockDeals: Deal[] = [
  { id: "dl_1", name: "Acme Robotics — Platform Rollout", company: "Acme Robotics", contact_id: "ct_1", amount: 42000, currency: "USD", pipeline_stage: "proposal", assignedTo: "Elena Kowalski", expected_close_date: "2026-07-25", status: "open" },
  { id: "dl_2", name: "Acme Robotics — Add-on Modules", company: "Acme Robotics", contact_id: "ct_6", amount: 9500, currency: "USD", pipeline_stage: "qualification", assignedTo: "Elena Kowalski", expected_close_date: "2026-08-10", status: "open" },
  { id: "dl_3", name: "Bluepeak — Annual Contract", company: "Bluepeak Financial", contact_id: "ct_2", amount: 78000, currency: "USD", pipeline_stage: "negotiation", assignedTo: "Elena Kowalski", expected_close_date: "2026-07-15", status: "open" },
  { id: "dl_4", name: "Verdant Foods — Pilot", company: "Verdant Foods Co.", contact_id: "ct_3", amount: 15000, currency: "USD", pipeline_stage: "closed_won", assignedTo: "Elena Kowalski", expected_close_date: "2026-06-30", status: "won" },
  { id: "dl_5", name: "Verdant Foods — Expansion", company: "Verdant Foods Co.", contact_id: "ct_9", amount: 30000, currency: "USD", pipeline_stage: "negotiation", assignedTo: "Elena Kowalski", expected_close_date: "2026-07-05", status: "open" },
  { id: "dl_6", name: "Verdant Foods — Support Add-on", company: "Verdant Foods Co.", contact_id: "ct_10", amount: 6000, currency: "USD", pipeline_stage: "closed_lost", assignedTo: "Elena Kowalski", expected_close_date: "2026-06-20", status: "lost" },
];

// Fixed "now" so relative timestamps and due-date labels match the mock
// data's dates deterministically, independent of the real wall clock.
export const MOCK_NOW = new Date("2026-07-11T12:00:00Z");

export function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
}

export function formatShortDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(iso));
}

export function formatFullDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(iso));
}

export function formatRelativeTime(iso: string): string {
  const diffMs = MOCK_NOW.getTime() - new Date(iso).getTime();
  const diffMins = Math.round(diffMs / 60_000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.round(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.round(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  return formatShortDate(iso);
}

export function getContactFullName(contact: Contact): string {
  return `${contact.first_name} ${contact.last_name}`;
}

export function getDealsForCompany(companyName: string): Deal[] {
  return mockDeals.filter((d) => d.company === companyName);
}

export function getContactsForCompany(companyName: string): Contact[] {
  return mockContacts.filter((c) => c.company === companyName);
}

export function getContactForDeal(deal: Deal): Contact | undefined {
  return mockContacts.find((c) => c.id === deal.contact_id);
}

export function getDealsForContact(contactId: string): Deal[] {
  return mockDeals.filter((d) => d.contact_id === contactId);
}

export function getCompanyByName(companyName: string): Company | undefined {
  return mockCompanies.find((c) => c.name === companyName);
}

export interface TimelineEntry {
  id: string;
  entity_type: "contact" | "company" | "deal";
  /** null for system-generated entries. */
  author: string | null;
  body: string;
  is_system_event: boolean;
  created_at: string;
}

export const mockTimelineByEntity: Record<string, TimelineEntry[]> = {
  ct_1: [
    {
      id: "tl_1",
      entity_type: "contact",
      author: "Elena Kowalski",
      body: "Called to follow up on the proposal — she wants to loop in their finance lead before signing.",
      is_system_event: false,
      created_at: "2026-07-10T15:20:00Z",
    },
    {
      id: "tl_2",
      entity_type: "contact",
      author: null,
      body: 'Deal "Acme Robotics — Platform Rollout" moved from Qualification to Proposal.',
      is_system_event: true,
      created_at: "2026-07-08T11:05:00Z",
    },
    {
      id: "tl_3",
      entity_type: "contact",
      author: "Elena Kowalski",
      body: "Initial discovery call — 45 min, walked through current tooling stack (HubSpot + Zendesk + Notion).",
      is_system_event: false,
      created_at: "2026-07-02T14:30:00Z",
    },
  ],
};

export function getTimelineForEntity(entityId: string): TimelineEntry[] {
  return mockTimelineByEntity[entityId] ?? [];
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function findDuplicateContactByEmail(email: string): Contact | undefined {
  const normalized = email.trim().toLowerCase();
  return mockContacts.find((c) => c.email.toLowerCase() === normalized);
}

export interface FieldErrors {
  [field: string]: string | undefined;
}

export interface NewContactInput {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  title: string;
  company: string;
  source: ContactSource;
}

export async function mockCreateContact(input: NewContactInput): Promise<{ ok: true; contact: Contact } | { ok: false; errors: FieldErrors }> {
  await delay(500);
  const errors: FieldErrors = {};
  if (!input.first_name.trim()) errors.first_name = "First name is required";
  if (!input.last_name.trim()) errors.last_name = "Last name is required";
  if (!isValidEmail(input.email)) errors.email = "Enter a valid email address";
  if (Object.keys(errors).length > 0) return { ok: false, errors };

  return {
    ok: true,
    contact: {
      id: `ct_${Math.random().toString(36).slice(2, 9)}`,
      first_name: input.first_name.trim(),
      last_name: input.last_name.trim(),
      email: input.email.trim(),
      phone: input.phone.trim() || null,
      title: input.title.trim(),
      company: input.company,
      source: input.source,
      assignedTo: "Elena Kowalski",
      createdAt: MOCK_NOW.toISOString(),
    },
  };
}

export interface ConvertLeadInput {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  title: string;
  company: string;
  amount: string;
  currency: string;
  expected_close_date: string;
  pipeline_stage: string;
}

export async function mockConvertLead(_leadId: string, input: ConvertLeadInput): Promise<{ ok: true; contactId: string; dealId: string } | { ok: false; errors: FieldErrors }> {
  void _leadId;
  await delay(600);
  const errors: FieldErrors = {};
  if (!input.first_name.trim()) errors.first_name = "First name is required";
  if (!isValidEmail(input.email)) errors.email = "Enter a valid email address";
  if (!input.amount || Number(input.amount) <= 0) errors.amount = "Enter a deal amount greater than 0";
  if (!input.expected_close_date) errors.expected_close_date = "Pick an expected close date";
  if (Object.keys(errors).length > 0) return { ok: false, errors };

  return {
    ok: true,
    contactId: `ct_${Math.random().toString(36).slice(2, 9)}`,
    dealId: `dl_${Math.random().toString(36).slice(2, 9)}`,
  };
}
