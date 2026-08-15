"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, X, TriangleAlert, Download } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
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
import { cn } from "@/lib/utils";
import {
  mockOrgDetail,
  mockSaveOrgGeneral,
  mockDeleteOrganization,
  daysUntilPermanentDeletion,
  IANA_TIMEZONES,
  ISO_CURRENCIES,
} from "@/lib/mock-org";
import {
  getNotificationPreferences,
  saveNotificationPreferences,
  NOTIFICATION_TYPE_LABELS,
  NOTIFICATION_TYPES,
  type NotificationPreference,
  type NotificationType,
} from "@/lib/mock-notifications";
import {
  mockSubscription,
  mockInvoices,
  PLAN_COMPARISON,
  formatBillingCurrency,
  formatBillingDate,
  usagePercent,
  meterTone,
  type Invoice,
} from "@/lib/mock-billing";
import { useBillingPastDue } from "@/lib/use-mock-billing";

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

function NotificationPreferencesCard() {
  const [prefs, setPrefs] = useState<Record<NotificationType, NotificationPreference>>(getNotificationPreferences);
  const [saving, setSaving] = useState(false);

  function toggle(type: NotificationType, channel: "email" | "inApp") {
    setPrefs((prev) => ({
      ...prev,
      [type]: { ...prev[type], [channel]: !prev[type][channel] },
    }));
  }

  async function handleSave() {
    setSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 400));
    saveNotificationPreferences(prefs);
    setSaving(false);
    toast.success("Notification preferences saved");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification preferences</CardTitle>
        <CardDescription>Choose how each notification type reaches you. Critical billing alerts cannot be disabled.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="overflow-hidden rounded-md border border-border">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-neutral-50 text-left text-xs font-medium text-neutral-600">
                <th className="px-3 py-2">Type</th>
                <th className="px-3 py-2 text-center">Email</th>
                <th className="px-3 py-2 text-center">In-app</th>
              </tr>
            </thead>
            <tbody>
              {NOTIFICATION_TYPES.map((type) => (
                <tr key={type} className="border-b border-border last:border-0">
                  <td className="px-3 py-2.5 font-medium text-neutral-950">{NOTIFICATION_TYPE_LABELS[type]}</td>
                  <td className="px-3 py-2.5 text-center">
                    <Switch
                      checked={prefs[type].email}
                      onCheckedChange={() => toggle(type, "email")}
                      aria-label={`Email ${NOTIFICATION_TYPE_LABELS[type]}`}
                    />
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    {type === "billing_past_due" ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="inline-flex cursor-not-allowed">
                            <Switch checked disabled className="cursor-not-allowed" aria-label="In-app Payment past due" />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>Critical account notifications cannot be disabled</TooltipContent>
                      </Tooltip>
                    ) : (
                      <Switch
                        checked={prefs[type].inApp}
                        onCheckedChange={() => toggle(type, "inApp")}
                        aria-label={`In-app ${NOTIFICATION_TYPE_LABELS[type]}`}
                      />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save preferences"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function UsageMeter({ label, usedLabel, percent }: { label: string; usedLabel: string; percent: number }) {
  const tone = meterTone(percent);
  const barClass = tone === "success" ? "bg-success" : tone === "warning" ? "bg-warning" : "bg-danger";

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-medium text-neutral-950">{label}</span>
        <span className="text-neutral-600">{usedLabel}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100">
        <div className={cn("h-full rounded-full", barClass)} style={{ width: `${Math.min(100, percent)}%` }} />
      </div>
    </div>
  );
}

function BillingTabContent({ role }: { role: UserRole }) {
  const isOwner = role === "owner";
  const [pastDue, setPastDue] = useBillingPastDue();
  const subscription = mockSubscription;

  const aiPercent = usagePercent(subscription.aiAgentRuns.used, subscription.aiAgentRuns.limit);
  const workflowPercent = usagePercent(subscription.workflowRuns.used, subscription.workflowRuns.limit);
  const kbPercent = usagePercent(subscription.kbStorageMB.used, subscription.kbStorageMB.limitMB);

  const invoiceColumns: DataTableColumn<Invoice>[] = [
    { key: "date", header: "Date", accessor: (inv) => formatBillingDate(inv.date) },
    { key: "amount", header: "Amount", accessor: (inv) => formatBillingCurrency(inv.amount, inv.currency) },
    {
      key: "status",
      header: "Status",
      accessor: (inv) => <StatusBadge variant={inv.status === "paid" ? "success" : "warning"}>{inv.status}</StatusBadge>,
    },
    {
      key: "actions",
      header: "",
      accessor: () => (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            toast.info("Invoice PDF would download here");
          }}
        >
          <Download className="size-3.5" />
          Download PDF
        </Button>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Billing demo</CardTitle>
          <CardDescription>Simulate billing states to preview the UI.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium text-neutral-950">Simulate past-due state</span>
            <span className="text-xs text-neutral-600">Demo only. Shows the past-due banner across the whole app.</span>
          </div>
          <Switch checked={pastDue} onCheckedChange={setPastDue} aria-label="Simulate past-due state" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Current plan
            <StatusBadge variant="success">Pro</StatusBadge>
          </CardTitle>
          <CardDescription>Renews {formatBillingDate(subscription.currentPeriodEnd)}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-sm text-neutral-600">
            You&apos;re on the Pro plan with unlimited seats and expanded usage limits.
          </p>
          {isOwner && (
            <div>
              <Button onClick={() => toast.info("This would open the Stripe customer portal")}>Manage subscription</Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Usage</CardTitle>
          <CardDescription>Your current usage against plan limits.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="font-medium text-neutral-950">Seats</span>
            <span className="text-neutral-600">
              {subscription.seats.used} seats used · {subscription.seats.label}
            </span>
          </div>
          <UsageMeter
            label="AI Agent Runs"
            usedLabel={`${subscription.aiAgentRuns.used.toLocaleString()} / ${subscription.aiAgentRuns.limit.toLocaleString()} runs (${Math.round(aiPercent * 10) / 10}%)`}
            percent={aiPercent}
          />
          <UsageMeter
            label="Workflow Runs"
            usedLabel={`${subscription.workflowRuns.used.toLocaleString()} / ${subscription.workflowRuns.limit.toLocaleString()} runs (${Math.round(workflowPercent * 10) / 10}%)`}
            percent={workflowPercent}
          />
          <UsageMeter
            label="KB Storage"
            usedLabel={`${subscription.kbStorageMB.label} (${Math.round(kbPercent * 10) / 10}%)`}
            percent={kbPercent}
          />
        </CardContent>
      </Card>

      {isOwner && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Plans</CardTitle>
              <CardDescription>Compare what&apos;s included on each plan.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="overflow-hidden rounded-md border border-border">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-border bg-neutral-50 text-left text-xs font-medium text-neutral-600">
                      <th className="px-3 py-2">Feature</th>
                      <th className="px-3 py-2">Free</th>
                      <th className="bg-primary/5 px-3 py-2 text-primary">Pro · Current</th>
                      <th className="px-3 py-2">Enterprise</th>
                    </tr>
                  </thead>
                  <tbody>
                    {PLAN_COMPARISON.map((row) => (
                      <tr key={row.feature} className="border-b border-border last:border-0">
                        <td className="px-3 py-2.5 font-medium text-neutral-950">{row.feature}</td>
                        <td className="px-3 py-2.5 text-neutral-600">{row.free}</td>
                        <td className="bg-primary/5 px-3 py-2.5 font-medium text-neutral-950">{row.pro}</td>
                        <td className="px-3 py-2.5 text-neutral-600">{row.enterprise}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-end">
                <Button size="sm" onClick={() => toast.info("Contact us to upgrade to Enterprise")}>
                  Upgrade to Enterprise
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Invoice history</CardTitle>
              <CardDescription>Past invoices for your subscription.</CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable columns={invoiceColumns} data={mockInvoices} getRowId={(inv) => inv.id} hasMore={false} />
            </CardContent>
          </Card>
        </>
      )}
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
    {
      value: "notifications",
      label: "Notifications",
      content: <NotificationPreferencesCard />,
    },
    ...(role === "owner" || role === "admin"
      ? [
          {
            value: "billing",
            label: "Billing",
            content: <BillingTabContent role={role} />,
          },
        ]
      : []),
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
