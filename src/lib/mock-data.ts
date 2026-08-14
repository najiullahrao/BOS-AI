export type UserRole = "owner" | "admin" | "manager" | "support_agent" | "sales_agent" | "employee";

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  platform_admin: boolean;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: "free" | "pro" | "enterprise";
  logoUrl: string | null;
}

export interface SessionContext {
  user: CurrentUser;
  organizations: Organization[];
  activeOrgId: string;
}

export const mockSession: SessionContext = {
  user: {
    id: "u_001",
    name: "Amara Chen",
    email: "amara@northlightagency.com",
    role: "owner",
    platform_admin: false,
  },
  organizations: [
    { id: "org_001", name: "Northlight Agency", slug: "northlight-agency", plan: "pro", logoUrl: null },
    {
      id: "org_002",
      name: "Northlight Agency — Sandbox",
      slug: "northlight-sandbox",
      plan: "free",
      logoUrl: null,
    },
  ],
  activeOrgId: "org_001",
};

export function getActiveOrg(session: SessionContext): Organization {
  const org = session.organizations.find((o) => o.id === session.activeOrgId);
  if (!org) return session.organizations[0];
  return org;
}

export function getUserInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
