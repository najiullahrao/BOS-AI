"use client";

import { useMemo, useState } from "react";
import { UserPlus } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type DataTableColumn, type DataTableSort } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { Modal } from "@/components/shared/modal";
import { Drawer } from "@/components/shared/drawer";
import { toast } from "@/components/shared/toast";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { mockSession } from "@/lib/mock-data";
import { canManageTeam } from "@/lib/org-permissions";
import { formatDateTime } from "@/lib/mock-sessions";
import { getUserInitials } from "@/lib/mock-data";
import {
  ALL_ROLES,
  INVITABLE_ROLES,
  ROLE_LABELS,
  mockChangeMemberRole,
  mockInviteMember,
  mockRemoveMember,
  mockResendInvite,
  mockRevokeInvite,
  mockTeamMembers,
  mockPendingInvitations,
  type InvitableRole,
  type PendingInvitation,
  type TeamMember,
} from "@/lib/mock-team";

function InlineRoleSelect({ member, onChange }: { member: TeamMember; onChange: (role: InvitableRole) => void }) {
  return (
    <div onClick={(e) => e.stopPropagation()}>
      <Select value={member.role} onValueChange={(value) => onChange(value as InvitableRole)}>
        <SelectTrigger className="h-7 w-36 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {INVITABLE_ROLES.map((role) => (
            <SelectItem key={role} value={role}>
              {ROLE_LABELS[role]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function InviteModal({
  open,
  onOpenChange,
  onInvited,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInvited: (invitation: PendingInvitation) => void;
}) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<InvitableRole>("employee");
  const [error, setError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    setSubmitting(true);
    setError(undefined);
    const result = await mockInviteMember({ email, role });
    setSubmitting(false);

    if (!result.ok) {
      setError(result.errors.email);
      return;
    }
    onInvited(result.invitation);
    toast.success(`Invitation sent to ${result.invitation.email}`);
    setEmail("");
    setRole("employee");
    onOpenChange(false);
  }

  return (
    <Modal
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) {
          setEmail("");
          setRole("employee");
          setError(undefined);
        }
      }}
      title="Invite team member"
      description="They'll receive an email invitation to join Northlight Agency."
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Sending…" : "Send invite"}
          </Button>
        </>
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
        className="flex flex-col gap-4"
      >
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="invite-email">Email</Label>
          <Input id="invite-email" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={Boolean(error)} />
          {error && <p className="text-xs text-danger">{error}</p>}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Role</Label>
          <Select value={role} onValueChange={(value) => setRole(value as InvitableRole)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {INVITABLE_ROLES.map((r) => (
                <SelectItem key={r} value={r}>
                  {ROLE_LABELS[r]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </form>
    </Modal>
  );
}

function PendingInvitationsSection({
  invitations,
  onResend,
  onRevoke,
}: {
  invitations: PendingInvitation[];
  onResend: (id: string) => void;
  onRevoke: (id: string) => void;
}) {
  if (invitations.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold text-neutral-950">Pending invitations</h2>
      <div className="flex flex-col gap-2">
        {invitations.map((invitation) => (
          <div
            key={invitation.id}
            className="flex flex-col gap-3 rounded-md border border-border p-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-neutral-950">{invitation.email}</span>
                <Badge variant="outline">{ROLE_LABELS[invitation.role]}</Badge>
              </div>
              <span className="text-xs text-neutral-600">
                Invited {formatDateTime(invitation.invitedAt)} · Expires {formatDateTime(invitation.expiresAt)}
              </span>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button variant="outline" size="sm" onClick={() => onResend(invitation.id)}>
                Resend
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onRevoke(invitation.id)}>
                Revoke
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MemberDetailDrawer({
  member,
  open,
  onOpenChange,
}: {
  member: TeamMember | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange} title={member?.name ?? ""} description={member?.email}>
      {member && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <Avatar size="lg">
              <AvatarFallback>{getUserInitials(member.name)}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-semibold text-neutral-950">{member.name}</span>
              <span className="text-sm text-neutral-600">{member.email}</span>
            </div>
          </div>

          <dl className="flex flex-col gap-3 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-neutral-600">Role</dt>
              <dd>
                <Badge variant="outline">{ROLE_LABELS[member.role]}</Badge>
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-neutral-600">Status</dt>
              <dd>
                <StatusBadge variant={member.status === "active" ? "success" : "danger"}>{member.status}</StatusBadge>
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-neutral-600">Last active</dt>
              <dd className="text-neutral-950">{formatDateTime(member.lastActive)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-neutral-600">Member ID</dt>
              <dd className="font-mono text-xs text-neutral-950">{member.id}</dd>
            </div>
          </dl>
        </div>
      )}
    </Drawer>
  );
}

function RemoveMemberModal({
  member,
  open,
  onOpenChange,
  onConfirm,
}: {
  member: TeamMember | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (memberId: string) => void;
}) {
  const [submitting, setSubmitting] = useState(false);

  async function handleConfirm() {
    if (!member) return;
    setSubmitting(true);
    await mockRemoveMember(member.id);
    setSubmitting(false);
    onConfirm(member.id);
    onOpenChange(false);
    toast.success(`${member.name} was removed`);
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Remove team member"
      description={member ? `This suspends ${member.name}'s access to Northlight Agency.` : undefined}
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={submitting}>
            {submitting ? "Removing…" : "Remove member"}
          </Button>
        </>
      }
    >
      <p className="text-sm text-neutral-600">
        {member?.name} will lose access immediately. You can reinstate them later by changing their status.
      </p>
    </Modal>
  );
}

export default function TeamPage() {
  const role = mockSession.user.role;
  const canManage = canManageTeam(role);

  const [members, setMembers] = useState<TeamMember[]>(mockTeamMembers);
  const [invitations, setInvitations] = useState<PendingInvitation[]>(mockPendingInvitations);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [sort, setSort] = useState<DataTableSort>({ key: "name", direction: "asc" });

  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<TeamMember | null>(null);

  const filteredMembers = useMemo(() => {
    const search = (filters.name ?? "").trim().toLowerCase();
    const roleFilter = filters.role ?? "";

    const filtered = members.filter((m) => {
      const matchesSearch = !search || m.name.toLowerCase().includes(search) || m.email.toLowerCase().includes(search);
      const matchesRole = !roleFilter || m.role === roleFilter;
      return matchesSearch && matchesRole;
    });

    const sorted = [...filtered].sort((a, b) => {
      const dir = sort.direction === "asc" ? 1 : -1;
      const key = sort.key as keyof TeamMember;
      return a[key] > b[key] ? dir : a[key] < b[key] ? -dir : 0;
    });

    return sorted;
  }, [members, filters, sort]);

  function handleRoleChange(member: TeamMember, newRole: InvitableRole) {
    setMembers((prev) => prev.map((m) => (m.id === member.id ? { ...m, role: newRole } : m)));
    mockChangeMemberRole(member.id, newRole).then(() => {
      toast.success(`Role updated to ${ROLE_LABELS[newRole]}`);
    });
  }

  function handleInvited(invitation: PendingInvitation) {
    setInvitations((prev) => [...prev, invitation]);
  }

  function handleResend(id: string) {
    mockResendInvite(id).then(() => toast.success("Invitation resent"));
  }

  function handleRevoke(id: string) {
    setInvitations((prev) => prev.filter((inv) => inv.id !== id));
    mockRevokeInvite(id).then(() => toast.success("Invitation revoked"));
  }

  function handleRemoveConfirmed(memberId: string) {
    setMembers((prev) => prev.map((m) => (m.id === memberId ? { ...m, status: "suspended" } : m)));
  }

  const columns: DataTableColumn<TeamMember>[] = [
    {
      key: "name",
      header: "Name",
      sortable: true,
      filterPlaceholder: "Search name or email…",
      accessor: (m) => (
        <div className="flex items-center gap-2.5">
          <Avatar size="sm">
            <AvatarFallback>{getUserInitials(m.name)}</AvatarFallback>
          </Avatar>
          <span className="font-medium text-neutral-950">{m.name}</span>
        </div>
      ),
    },
    {
      key: "email",
      header: "Email",
      accessor: (m) => <span className="text-neutral-600">{m.email}</span>,
    },
    {
      key: "role",
      header: "Role",
      filterOptions: ALL_ROLES.map((r) => ({ label: ROLE_LABELS[r], value: r })),
      accessor: (m) =>
        canManage && m.role !== "owner" ? (
          <InlineRoleSelect member={m} onChange={(newRole) => handleRoleChange(m, newRole)} />
        ) : (
          <Badge variant="outline">{ROLE_LABELS[m.role]}</Badge>
        ),
    },
    {
      key: "status",
      header: "Status",
      accessor: (m) => <StatusBadge variant={m.status === "active" ? "success" : "danger"}>{m.status}</StatusBadge>,
    },
    {
      key: "lastActive",
      header: "Last Active",
      sortable: true,
      accessor: (m) => formatDateTime(m.lastActive),
    },
    ...(canManage
      ? [
          {
            key: "actions",
            header: "",
            accessor: (m: TeamMember) =>
              m.role === "owner" ? null : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    setRemoveTarget(m);
                  }}
                >
                  Remove
                </Button>
              ),
          },
        ]
      : []),
  ];

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Team"
        breadcrumbs={[{ label: "Home", href: "/dashboard" }, { label: "Team" }]}
        primaryAction={canManage ? { label: "Invite member", icon: UserPlus, onClick: () => setInviteOpen(true) } : undefined}
      />

      <DataTable
        columns={columns}
        data={filteredMembers}
        getRowId={(m) => m.id}
        onRowClick={(m) => setSelectedMember(m)}
        sort={sort}
        onSortChange={(key) => setSort((prev) => ({ key, direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc" }))}
        filters={filters}
        onFilterChange={(key, value) => setFilters((prev) => ({ ...prev, [key]: value }))}
        hasMore={false}
      />

      {canManage && <PendingInvitationsSection invitations={invitations} onResend={handleResend} onRevoke={handleRevoke} />}

      <MemberDetailDrawer member={selectedMember} open={Boolean(selectedMember)} onOpenChange={(open) => !open && setSelectedMember(null)} />

      <InviteModal open={inviteOpen} onOpenChange={setInviteOpen} onInvited={handleInvited} />

      <RemoveMemberModal
        member={removeTarget}
        open={Boolean(removeTarget)}
        onOpenChange={(open) => !open && setRemoveTarget(null)}
        onConfirm={handleRemoveConfirmed}
      />
    </div>
  );
}
