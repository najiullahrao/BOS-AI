import { isValidEmail } from "@/lib/validation";

export type TeamRole = "owner" | "admin" | "manager" | "support_agent" | "sales_agent" | "employee";
export type InvitableRole = Exclude<TeamRole, "owner">;
export type MemberStatus = "active" | "suspended";

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: TeamRole;
  status: MemberStatus;
  lastActive: string;
}

export interface PendingInvitation {
  id: string;
  email: string;
  role: InvitableRole;
  invitedAt: string;
  expiresAt: string;
}

export const ROLE_LABELS: Record<TeamRole, string> = {
  owner: "Owner",
  admin: "Admin",
  manager: "Manager",
  support_agent: "Support Agent",
  sales_agent: "Sales Agent",
  employee: "Employee",
};

export const INVITABLE_ROLES: InvitableRole[] = ["admin", "manager", "support_agent", "sales_agent", "employee"];
export const ALL_ROLES: TeamRole[] = ["owner", "admin", "manager", "support_agent", "sales_agent", "employee"];

export const mockTeamMembers: TeamMember[] = [
  { id: "u_001", name: "Amara Chen", email: "amara@northlightagency.com", role: "owner", status: "active", lastActive: "2026-07-11T09:14:00Z" },
  { id: "u_002", name: "Diego Ramirez", email: "diego@northlightagency.com", role: "admin", status: "active", lastActive: "2026-07-10T16:40:00Z" },
  { id: "u_003", name: "Priya Nair", email: "priya@northlightagency.com", role: "manager", status: "active", lastActive: "2026-07-11T08:02:00Z" },
  { id: "u_004", name: "Tom Baker", email: "tom@northlightagency.com", role: "support_agent", status: "active", lastActive: "2026-07-11T07:55:00Z" },
  { id: "u_005", name: "Elena Kowalski", email: "elena@northlightagency.com", role: "sales_agent", status: "active", lastActive: "2026-07-09T13:20:00Z" },
  { id: "u_006", name: "Jamal Whitfield", email: "jamal@northlightagency.com", role: "employee", status: "suspended", lastActive: "2026-06-28T10:11:00Z" },
];

export const mockPendingInvitations: PendingInvitation[] = [
  { id: "inv_1", email: "new.hire@northlightagency.com", role: "support_agent", invitedAt: "2026-07-09T00:00:00Z", expiresAt: "2026-07-16T00:00:00Z" },
];

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const INVITE_EXPIRY_DAYS = 7;

export interface FieldErrors {
  [field: string]: string | undefined;
}

export async function mockInviteMember(input: { email: string; role: InvitableRole }): Promise<
  | { ok: true; invitation: PendingInvitation }
  | { ok: false; errors: FieldErrors }
> {
  await delay(500);
  if (!isValidEmail(input.email)) {
    return { ok: false, errors: { email: "Enter a valid email address" } };
  }
  const now = new Date();
  const expires = new Date(now.getTime() + INVITE_EXPIRY_DAYS * 86_400_000);
  return {
    ok: true,
    invitation: {
      id: `inv_${Math.random().toString(36).slice(2, 9)}`,
      email: input.email.trim(),
      role: input.role,
      invitedAt: now.toISOString(),
      expiresAt: expires.toISOString(),
    },
  };
}

export async function mockResendInvite(_invitationId: string): Promise<{ ok: true }> {
  void _invitationId;
  await delay(400);
  return { ok: true };
}

export async function mockRevokeInvite(_invitationId: string): Promise<{ ok: true }> {
  void _invitationId;
  await delay(400);
  return { ok: true };
}

export async function mockChangeMemberRole(_memberId: string, _role: TeamRole): Promise<{ ok: true }> {
  void _memberId;
  void _role;
  await delay(400);
  return { ok: true };
}

export async function mockRemoveMember(_memberId: string): Promise<{ ok: true }> {
  void _memberId;
  await delay(500);
  return { ok: true };
}
