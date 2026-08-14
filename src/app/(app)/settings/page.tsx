"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, X, TriangleAlert } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { DetailLayout } from "@/components/shared/detail-layout";
import { StatusBadge } from "@/components/shared/status-badge";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { Modal } from "@/components/shared/modal";
import { toast } from "@/components/shared/toast";
import { OrgAvatar } from "@/components/shared/org-avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PasswordInput } from "@/components/auth/password-input";
import { MfaCodeInput } from "@/components/auth/mfa-code-input";
import { GoogleIcon, GitHubIcon } from "@/components/auth/oauth-icons";
import { mockChangePassword, mockReauthenticate, mockVerifyMfaCode, type FieldErrors } from "@/lib/mock-auth";
import { PASSWORD_POLICY_HINT, isValidSixDigitCode } from "@/lib/validation";
import { useMockMfaEnabled } from "@/lib/use-mock-mfa";
import { useMockOrgDeletion } from "@/lib/use-mock-org-deletion";
import { mockActiveSessions, mockLinkedAccounts, mockLocationFromIp, formatDateTime, type ActiveSession } from "@/lib/mock-sessions";
import { mockSession, type UserRole } from "@/lib/mock-data";
import { canEditOrgBranding, canManageOrgDangerZone } from "@/lib/org-permissions";
import {
  mockOrgDetail,
  mockSaveOrgGeneral,
  mockDeleteOrganization,
  daysUntilPermanentDeletion,
  IANA_TIMEZONES,
  ISO_CURRENCIES,
} from "@/lib/mock-org";

interface OrgFormState {
  name: string;
  slug: string;
  timezone: string;
  currency: string;
  logoUrl: string | null;
}

function orgFormFromDetail(): OrgFormState {
  return {
    name: mockOrgDetail.name,
    slug: mockOrgDetail.slug,
    timezone: mockOrgDetail.default_timezone,
    currency: mockOrgDetail.default_currency,
    logoUrl: mockOrgDetail.logoUrl,
  };
}

function GeneralSettingsCard({ role }: { role: UserRole }) {
  const canEdit = canEditOrgBranding(role);
  const [baseline, setBaseline] = useState<OrgFormState>(orgFormFromDetail);
  const [form, setForm] = useState<OrgFormState>(orgFormFromDetail);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isDirty =
    form.name !== baseline.name ||
    form.slug !== baseline.slug ||
    form.timezone !== baseline.timezone ||
    form.currency !== baseline.currency ||
    form.logoUrl !== baseline.logoUrl;

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm((prev) => ({ ...prev, logoUrl: reader.result as string }));
    reader.readAsDataURL(file);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!isDirty) return;
    setSubmitting(true);
    await mockSaveOrgGeneral({ name: form.name, slug: form.slug, default_timezone: form.timezone, default_currency: form.currency, logoUrl: form.logoUrl });
    setSubmitting(false);
    setBaseline(form);
    toast.success("Organization settings updated");
  }

  if (!canEdit) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Organization</CardTitle>
          <CardDescription>Only Owners and Admins can edit these settings.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm">
          <div className="flex items-center gap-3">
            <OrgAvatar name={form.name} logoUrl={form.logoUrl} size="md" />
            <span className="font-medium text-neutral-950">{form.name}</span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-neutral-600">
            <span>
              Slug: <span className="font-mono text-neutral-950">{form.slug}</span>
            </span>
            <span>Timezone: <span className="text-neutral-950">{form.timezone}</span></span>
            <span>Currency: <span className="text-neutral-950">{form.currency}</span></span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Organization</CardTitle>
        <CardDescription>Manage your organization&apos;s identity and defaults.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <OrgAvatar name={form.name} logoUrl={form.logoUrl} size="md" />
            <div className="flex gap-2">
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
              <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                <Upload className="size-3.5" />
                Upload logo
              </Button>
              {form.logoUrl && (
                <Button type="button" variant="ghost" size="sm" onClick={() => setForm((prev) => ({ ...prev, logoUrl: null }))}>
                  <X className="size-3.5" />
                  Remove
                </Button>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="org-general-name">Name</Label>
            <Input id="org-general-name" value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="org-general-slug">Slug</Label>
            <Input
              id="org-general-slug"
              className="font-mono"
              value={form.slug}
              onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label>Default timezone</Label>
              <Select value={form.timezone} onValueChange={(value) => setForm((prev) => ({ ...prev, timezone: value }))}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {IANA_TIMEZONES.map((tz) => (
                    <SelectItem key={tz} value={tz}>
                      {tz}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Default currency</Label>
              <Select value={form.currency} onValueChange={(value) => setForm((prev) => ({ ...prev, currency: value }))}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ISO_CURRENCIES.map((currency) => (
                    <SelectItem key={currency} value={currency}>
                      {currency}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Button type="submit" disabled={!isDirty || submitting}>
              {submitting ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function DangerZoneCard() {
  const [deletedAt, setDeletedAt] = useMockOrgDeletion();
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  if (deletedAt) {
    const daysRemaining = daysUntilPermanentDeletion(deletedAt);
    return (
      <Card>
        <CardHeader>
          <CardTitle>Deletion scheduled</CardTitle>
          <CardDescription>
            {mockOrgDetail.name} will be permanently deleted in {daysRemaining} day{daysRemaining === 1 ? "" : "s"}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            onClick={() => {
              setDeletedAt(null);
              toast.success("Deletion canceled");
            }}
          >
            Cancel deletion
          </Button>
        </CardContent>
      </Card>
    );
  }

  const canDelete = confirmText === mockOrgDetail.name;

  async function handleDelete() {
    if (!canDelete) return;
    setDeleting(true);
    await mockDeleteOrganization();
    setDeleting(false);
    setDeletedAt(new Date().toISOString());
    setConfirmText("");
    toast.success("Organization scheduled for deletion");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-danger">Delete organization</CardTitle>
        <CardDescription>Permanently delete {mockOrgDetail.name} and all of its data.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-start gap-2 rounded-md border border-danger/30 bg-danger/10 p-3 text-sm text-neutral-950">
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden="true" />
          <p>
            Deleting starts a <strong>14-day grace period</strong>. The organization becomes read-only immediately.
            After 14 days, all data is permanently and irreversibly deleted.
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="confirm-org-name">
            Type <span className="font-semibold text-neutral-950">{mockOrgDetail.name}</span> to confirm
          </Label>
          <Input id="confirm-org-name" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} />
        </div>

        <div>
          <Button variant="destructive" disabled={!canDelete || deleting} onClick={handleDelete}>
            {deleting ? "Deleting…" : "Delete organization"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ChangePasswordCard() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setErrors({ confirmPassword: "Passwords don't match" });
      return;
    }
    setSubmitting(true);
    setErrors({});
    const result = await mockChangePassword({ currentPassword, newPassword });
    setSubmitting(false);

    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    toast.success("Password updated");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Password</CardTitle>
        <CardDescription>Update the password you use to log in.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <PasswordInput
            label="Current password"
            value={currentPassword}
            onChange={setCurrentPassword}
            autoComplete="current-password"
            error={errors.currentPassword}
          />
          <PasswordInput
            label="New password"
            value={newPassword}
            onChange={setNewPassword}
            autoComplete="new-password"
            hint={PASSWORD_POLICY_HINT}
            error={errors.newPassword}
          />
          <PasswordInput
            label="Confirm new password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            autoComplete="new-password"
            error={errors.confirmPassword}
          />
          <div>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving…" : "Update password"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function TwoFactorCard() {
  const router = useRouter();
  const [mfaEnabled, setMfaEnabled] = useMockMfaEnabled();
  const [reauthOpen, setReauthOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [passwordError, setPasswordError] = useState<string | undefined>();
  const [codeError, setCodeError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = password.trim().length > 0 && isValidSixDigitCode(code);

  function resetForm() {
    setPassword("");
    setCode("");
    setPasswordError(undefined);
    setCodeError(undefined);
  }

  async function handleDisable(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    setPasswordError(undefined);
    setCodeError(undefined);
    // Both factors must independently pass — a correct password with a bad
    // code (or vice versa) must not disable MFA.
    const [passwordResult, codeResult] = await Promise.all([mockReauthenticate(password), mockVerifyMfaCode(code)]);
    setSubmitting(false);

    let failed = false;
    if (!passwordResult.ok) {
      setPasswordError(passwordResult.errors.password);
      failed = true;
    }
    if (!codeResult.ok) {
      setCodeError(codeResult.errors.code);
      failed = true;
    }
    if (failed) return;

    setMfaEnabled(false);
    setReauthOpen(false);
    resetForm();
    toast.success("Two-factor authentication disabled");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Two-factor authentication
          <StatusBadge variant={mfaEnabled ? "success" : "neutral"}>{mfaEnabled ? "Enabled" : "Disabled"}</StatusBadge>
        </CardTitle>
        <CardDescription>Require a 6-digit code from an authenticator app when logging in.</CardDescription>
      </CardHeader>
      <CardContent>
        {mfaEnabled ? (
          <Button variant="outline" onClick={() => setReauthOpen(true)}>
            Disable two-factor authentication
          </Button>
        ) : (
          <Button onClick={() => router.push("/mfa-setup")}>Enable two-factor authentication</Button>
        )}
      </CardContent>

      <Modal
        open={reauthOpen}
        onOpenChange={(open) => {
          setReauthOpen(open);
          if (!open) resetForm();
        }}
        title="Confirm your identity to disable MFA"
        description="Enter your password and a current 6-digit authentication code — both factors are required to turn off two-factor authentication."
        footer={
          <>
            <Button variant="outline" onClick={() => setReauthOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleDisable} disabled={submitting || !canSubmit}>
              {submitting ? "Confirming…" : "Confirm"}
            </Button>
          </>
        }
      >
        <form onSubmit={handleDisable} className="flex flex-col gap-4">
          <PasswordInput label="Password" value={password} onChange={setPassword} autoComplete="current-password" error={passwordError} />
          <MfaCodeInput label="Authentication code" value={code} onChange={setCode} error={codeError} />
        </form>
      </Modal>
    </Card>
  );
}

function LinkedAccountsCard() {
  const handleClick = (provider: string) => () =>
    toast.info("OAuth not connected in demo", { description: `${provider} sign-in isn't wired up in this preview.` });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Linked accounts</CardTitle>
        <CardDescription>Sign in faster by connecting an external account.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {mockLinkedAccounts.map((account) => (
          <div key={account.provider} className="flex items-center justify-between gap-3 rounded-md border border-border p-3">
            <div className="flex items-center gap-3">
              {account.provider === "Google" ? <GoogleIcon className="size-5" /> : <GitHubIcon className="size-5" />}
              <div className="flex flex-col">
                <span className="text-sm font-medium text-neutral-950">{account.provider}</span>
                <span className="text-xs text-neutral-600">{account.connected ? account.email : "Not connected"}</span>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleClick(account.provider)}>
              {account.connected ? "Disconnect" : "Connect"}
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function ActiveSessionsCard() {
  const [sessions, setSessions] = useState<ActiveSession[]>(mockActiveSessions);

  function revoke(id: string) {
    setSessions((prev) => prev.filter((s) => s.id !== id));
    toast.success("Session revoked");
  }

  const columns: DataTableColumn<ActiveSession>[] = [
    {
      key: "device",
      header: "Device/Browser",
      accessor: (s) => (
        <div className="flex items-center gap-2">
          <span>{s.device}</span>
          {s.current && <StatusBadge variant="info" dot={false}>This device</StatusBadge>}
        </div>
      ),
    },
    {
      key: "location",
      header: "Location",
      accessor: (s) => (
        <div className="flex flex-col">
          <span>{mockLocationFromIp(s.ip)}</span>
          <span className="font-mono text-xs text-neutral-600">{s.ip}</span>
        </div>
      ),
    },
    {
      key: "lastActive",
      header: "Last Active",
      accessor: (s) => formatDateTime(s.lastActive),
    },
    {
      key: "actions",
      header: "",
      accessor: (s) =>
        s.current ? (
          <Button variant="ghost" size="sm" disabled>
            This device
          </Button>
        ) : (
          <Button variant="outline" size="sm" onClick={() => revoke(s.id)}>
            Revoke
          </Button>
        ),
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Active sessions</CardTitle>
        <CardDescription>Devices currently signed in to your account.</CardDescription>
      </CardHeader>
      <CardContent>
        <DataTable columns={columns} data={sessions} getRowId={(s) => s.id} hasMore={false} />
      </CardContent>
    </Card>
  );
}

function SecurityTabContent() {
  return (
    <div className="flex flex-col gap-6">
      <ChangePasswordCard />
      <TwoFactorCard />
      <LinkedAccountsCard />
      <ActiveSessionsCard />
    </div>
  );
}

export default function SettingsPage() {
  const role = mockSession.user.role;

  const tabs = [
    {
      value: "general",
      label: "General",
      content: <GeneralSettingsCard role={role} />,
    },
    {
      value: "security",
      label: "Security",
      content: <SecurityTabContent />,
    },
    ...(canManageOrgDangerZone(role)
      ? [
          {
            value: "danger-zone",
            label: "Danger Zone",
            content: <DangerZoneCard />,
          },
        ]
      : []),
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Settings" breadcrumbs={[{ label: "Home", href: "/dashboard" }, { label: "Settings" }]} />

      <DetailLayout
        header={<p className="text-sm text-neutral-600">Manage your account, security, and preferences.</p>}
        tabs={tabs}
      />
    </div>
  );
}
