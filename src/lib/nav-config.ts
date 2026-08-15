import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Users,
  Ticket,
  BookOpen,
  Bot,
  Cpu,
  Workflow,
  BarChart3,
  Settings,
  ShieldCheck,
  UserCog,
} from "lucide-react";
import type { CurrentUser, UserRole } from "@/lib/mock-data";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Roles that CANNOT see this item. Item is visible to everyone if omitted. */
  hiddenForRoles?: UserRole[];
  /** Marks an item that should be visually separated from the primary nav group. */
  isAdminOnly?: boolean;
}

export const PRIMARY_NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "CRM", href: "/crm", icon: Users, hiddenForRoles: ["employee"] },
  { label: "Tickets", href: "/tickets", icon: Ticket },
  { label: "Knowledge Base", href: "/knowledge-base", icon: BookOpen },
  { label: "AI Chat", href: "/ai-chat", icon: Bot },
  { label: "AI Agents", href: "/ai-agents", icon: Cpu },
  { label: "Workflows", href: "/workflows", icon: Workflow },
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
  { label: "Team", href: "/team", icon: UserCog },
  { label: "Settings", href: "/settings", icon: Settings },
];

export const ADMIN_PORTAL_ITEM: NavItem = {
  label: "Admin Portal",
  href: "/admin",
  icon: ShieldCheck,
  isAdminOnly: true,
};

export function getVisiblePrimaryNavItems(user: CurrentUser): NavItem[] {
  return PRIMARY_NAV_ITEMS.filter((item) => !item.hiddenForRoles?.includes(user.role));
}

export function getAdminPortalItem(user: CurrentUser): NavItem | null {
  return user.platform_admin ? ADMIN_PORTAL_ITEM : null;
}
