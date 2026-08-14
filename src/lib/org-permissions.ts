import type { UserRole } from "@/lib/mock-data";

/** Owner and Admin can edit org name, slug, and branding (logo). */
export function canEditOrgBranding(role: UserRole): boolean {
  return role === "owner" || role === "admin";
}

/** Only Owner can change plan, delete the org, or transfer ownership. */
export function canManageOrgDangerZone(role: UserRole): boolean {
  return role === "owner";
}

/** Owner and Admin can invite members, change roles, and remove members. */
export function canManageTeam(role: UserRole): boolean {
  return role === "owner" || role === "admin";
}
