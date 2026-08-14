export interface OrgDetail {
  id: string;
  name: string;
  slug: string;
  default_currency: string;
  default_timezone: string;
  plan: "free" | "pro" | "enterprise";
  logoUrl: string | null;
}

export const mockOrgDetail: OrgDetail = {
  id: "org_001",
  name: "Northlight Agency",
  slug: "northlight-agency",
  default_currency: "USD",
  default_timezone: "America/New_York",
  plan: "pro",
  logoUrl: null,
};

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const RESERVED_SLUGS = ["northlight-agency", "northlight-sandbox", "acme", "admin", "app", "www"];

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function mockCheckSlugAvailability(slug: string): Promise<{ available: boolean }> {
  await delay(600);
  return { available: !RESERVED_SLUGS.includes(slug) };
}

export interface TeamInvite {
  email: string;
  role: "admin" | "manager" | "employee";
}

export async function mockSendInvites(invites: TeamInvite[]): Promise<{ ok: true; sent: number }> {
  await delay(500);
  return { ok: true, sent: invites.length };
}

export async function mockCreateOrganization(input: { name: string; slug: string }): Promise<{ ok: true; orgId: string }> {
  await delay(500);
  return { ok: true, orgId: `org_${slugify(input.slug)}` };
}

export interface OrgGeneralSettings {
  name: string;
  slug: string;
  default_timezone: string;
  default_currency: string;
  logoUrl: string | null;
}

export async function mockSaveOrgGeneral(input: OrgGeneralSettings): Promise<{ ok: true }> {
  void input;
  await delay(500);
  return { ok: true };
}

export async function mockDeleteOrganization(): Promise<{ ok: true }> {
  await delay(600);
  return { ok: true };
}

export const ORG_DELETION_GRACE_PERIOD_DAYS = 14;

/** Days remaining before permanent deletion, clamped to [0, grace period]. */
export function daysUntilPermanentDeletion(deletedAt: string): number {
  const elapsedMs = Date.now() - new Date(deletedAt).getTime();
  const elapsedDays = Math.floor(elapsedMs / 86_400_000);
  return Math.max(0, ORG_DELETION_GRACE_PERIOD_DAYS - elapsedDays);
}

function getTimezones(): string[] {
  try {
    return Intl.supportedValuesOf("timeZone");
  } catch {
    return ["UTC", "America/New_York", "America/Los_Angeles", "Europe/London", "Europe/Berlin", "Asia/Singapore", "Asia/Tokyo", "Australia/Sydney"];
  }
}

function getCurrencies(): string[] {
  try {
    return Intl.supportedValuesOf("currency");
  } catch {
    return ["USD", "EUR", "GBP", "JPY", "AUD", "CAD", "SGD", "CHF"];
  }
}

export const IANA_TIMEZONES = getTimezones();
export const ISO_CURRENCIES = getCurrencies();
