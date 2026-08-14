"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronsUpDown, Check, LogOut, Menu, Plus, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/shared/brand-mark";
import { OrgAvatar } from "@/components/shared/org-avatar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { getActiveOrg, getUserInitials, mockSession, type SessionContext } from "@/lib/mock-data";
import { getAdminPortalItem, getVisiblePrimaryNavItems, type NavItem } from "@/lib/nav-config";
import { useMockOrgDeletion } from "@/lib/use-mock-org-deletion";
import { daysUntilPermanentDeletion } from "@/lib/mock-org";
import { toast } from "@/components/shared/toast";

export interface NavShellProps {
  session?: SessionContext;
  children: React.ReactNode;
}

function NavLink({ item, active, onNavigate }: { item: NavItem; active: boolean; onNavigate?: () => void }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors",
        active
          ? "bg-primary/10 font-semibold text-primary"
          : "font-medium text-neutral-600 hover:bg-neutral-50 hover:text-neutral-950"
      )}
    >
      <Icon className="size-4 shrink-0" aria-hidden="true" />
      {item.label}
    </Link>
  );
}

function SidebarContent({
  session,
  pathname,
  onNavigate,
}: {
  session: SessionContext;
  pathname: string;
  onNavigate?: () => void;
}) {
  const navItems = getVisiblePrimaryNavItems(session.user);
  const adminItem = getAdminPortalItem(session.user);

  return (
    <div className="flex h-full flex-col gap-4 p-3">
      <div className="flex items-center gap-2 px-2 py-1.5">
        <BrandMark />
        <span className="text-sm font-semibold text-neutral-950">AI-BOS</span>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {navItems.map((item) => (
          <NavLink key={item.href} item={item} active={pathname.startsWith(item.href)} onNavigate={onNavigate} />
        ))}
      </nav>

      {adminItem && (
        <div className="border-t border-neutral-200 pt-3">
          <div className="rounded-md border border-warning/30 bg-warning/5 p-1">
            <NavLink item={adminItem} active={pathname.startsWith(adminItem.href)} onNavigate={onNavigate} />
          </div>
        </div>
      )}
    </div>
  );
}

function OrgSwitcher({
  session,
  activeOrgId,
  onSwitchOrg,
}: {
  session: SessionContext;
  activeOrgId: string;
  onSwitchOrg: (orgId: string) => void;
}) {
  const activeOrg = getActiveOrg({ ...session, activeOrgId });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="max-w-56 justify-between gap-2">
          <span className="flex min-w-0 items-center gap-1.5">
            <OrgAvatar name={activeOrg.name} logoUrl={activeOrg.logoUrl} />
            <span className="truncate">{activeOrg.name}</span>
          </span>
          <ChevronsUpDown className="size-3.5 shrink-0 text-neutral-600" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel>Organizations</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {session.organizations.map((org) => (
          <DropdownMenuItem key={org.id} onSelect={() => onSwitchOrg(org.id)} className="justify-between">
            <span className="flex items-center gap-2">
              <OrgAvatar name={org.name} logoUrl={org.logoUrl} />
              <span className="flex flex-col">
                <span className="text-sm">{org.name}</span>
                <span className="font-mono text-xs text-neutral-600">
                  {org.slug} · {org.plan}
                </span>
              </span>
            </span>
            {org.id === activeOrgId && <Check className="size-4 shrink-0 text-primary" />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/onboarding" className="flex items-center gap-2">
            <Plus className="size-4" />
            Create new organization
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function OrgDeletionBanner({ role }: { role: SessionContext["user"]["role"] }) {
  const [deletedAt, setDeletedAt] = useMockOrgDeletion();

  if (!deletedAt || role !== "owner") return null;

  const daysRemaining = daysUntilPermanentDeletion(deletedAt);

  return (
    <div className="flex items-center gap-2 border-b border-warning/30 bg-warning/10 px-4 py-2 text-sm text-neutral-950">
      <TriangleAlert className="size-4 shrink-0 text-warning" aria-hidden="true" />
      <span className="flex-1">
        This organization is scheduled for deletion in {daysRemaining} day{daysRemaining === 1 ? "" : "s"}.
      </span>
      <button
        type="button"
        onClick={() => {
          setDeletedAt(null);
          toast.success("Deletion canceled");
        }}
        className="shrink-0 font-medium text-warning hover:underline"
      >
        Cancel deletion
      </button>
    </div>
  );
}

function UserMenu({ session }: { session: SessionContext }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-md p-1 hover:bg-neutral-50">
          <Avatar size="sm">
            <AvatarFallback>{getUserInitials(session.user.name)}</AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col gap-0.5 py-1.5">
          <span className="text-sm font-medium text-neutral-950">{session.user.name}</span>
          <span className="text-xs font-normal text-neutral-600">{session.user.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <LogOut className="size-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function NavShell({ session = mockSession, children }: NavShellProps) {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [activeOrgId, setActiveOrgId] = useState(session.activeOrgId);

  return (
    <div className="flex min-h-screen bg-surface">
      {/* Desktop sidebar, lg and up */}
      <aside className="hidden w-60 shrink-0 border-r border-border lg:block">
        <SidebarContent session={session} pathname={pathname} />
      </aside>

      {/* Mobile slide-out drawer, below lg */}
      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent side="left" className="max-w-64 p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SidebarContent session={session} pathname={pathname} onNavigate={() => setMobileNavOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border px-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon-sm"
              className="lg:hidden"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open navigation"
            >
              <Menu className="size-4" />
            </Button>
            <OrgSwitcher session={session} activeOrgId={activeOrgId} onSwitchOrg={setActiveOrgId} />
          </div>

          <UserMenu session={session} />
        </header>

        <OrgDeletionBanner role={session.user.role} />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
