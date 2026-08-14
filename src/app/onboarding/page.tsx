"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, Plus, Trash2, XCircle } from "lucide-react";
import { WizardCard } from "@/components/onboarding/wizard-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/shared/toast";
import { isValidEmail } from "@/lib/validation";
import { mockCheckSlugAvailability, mockCreateOrganization, mockSendInvites, slugify, type TeamInvite } from "@/lib/mock-org";

type SlugCheckState = "idle" | "checking" | "available" | "unavailable";

interface InviteRow {
  id: number;
  email: string;
  role: TeamInvite["role"];
}

let nextRowId = 1;
function createInviteRow(): InviteRow {
  return { id: nextRowId++, email: "", role: "employee" };
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);

  const [orgName, setOrgName] = useState("");
  const [manualSlug, setManualSlug] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const [rows, setRows] = useState<InviteRow[]>([createInviteRow()]);
  const [sendingInvites, setSendingInvites] = useState(false);

  const slug = manualSlug ?? slugify(orgName);

  // Tracks the outcome of the last completed availability check. "checking"
  // is derived below by comparing its slug against the current slug, rather
  // than tracked as separate state — avoids setState-in-effect entirely.
  const [slugCheckResult, setSlugCheckResult] = useState<{ slug: string; available: boolean } | null>(null);
  const checkTokenRef = useRef(0);

  useEffect(() => {
    if (!slug) return;
    const token = ++checkTokenRef.current;
    mockCheckSlugAvailability(slug).then((result) => {
      if (checkTokenRef.current !== token) return;
      setSlugCheckResult({ slug, available: result.available });
    });
  }, [slug]);

  const slugCheck: SlugCheckState = !slug
    ? "idle"
    : slugCheckResult?.slug !== slug
      ? "checking"
      : slugCheckResult.available
        ? "available"
        : "unavailable";

  const canContinueStep1 = orgName.trim().length > 0 && slugCheck === "available" && !creating;

  async function handleStep1Continue() {
    if (!canContinueStep1) return;
    setCreating(true);
    await mockCreateOrganization({ name: orgName, slug });
    setCreating(false);
    setStep(2);
  }

  function updateRow(id: number, patch: Partial<InviteRow>) {
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  }

  function removeRow(id: number) {
    setRows((prev) => prev.filter((row) => row.id !== id));
  }

  const invalidRow = rows.find((row) => row.email.trim().length > 0 && !isValidEmail(row.email));
  const canContinueStep2 = !invalidRow && !sendingInvites;

  async function finishOnboarding() {
    router.push("/dashboard");
    toast.success(`Welcome to ${orgName}!`);
  }

  async function handleStep2Continue() {
    if (!canContinueStep2) return;
    const validInvites: TeamInvite[] = rows
      .filter((row) => row.email.trim().length > 0)
      .map((row) => ({ email: row.email.trim(), role: row.role }));

    if (validInvites.length > 0) {
      setSendingInvites(true);
      await mockSendInvites(validInvites);
      setSendingInvites(false);
      toast.success(`${validInvites.length} invite${validInvites.length === 1 ? "" : "s"} sent`);
    }
    finishOnboarding();
  }

  if (step === 1) {
    return (
      <WizardCard step={1} totalSteps={2} title="Name your organization" description="This is how it'll appear across AI-BOS.">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="org-name">Organization name</Label>
            <Input id="org-name" autoFocus value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder="Acme Inc." />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="org-slug">URL slug</Label>
            <Input
              id="org-slug"
              value={slug}
              onChange={(e) => {
                setManualSlug(slugify(e.target.value));
              }}
              className="font-mono"
            />
            <div className="flex h-4 items-center gap-1.5 text-xs">
              {slugCheck === "checking" && (
                <>
                  <Loader2 className="size-3.5 animate-spin text-neutral-600" />
                  <span className="text-neutral-600">Checking availability…</span>
                </>
              )}
              {slugCheck === "available" && (
                <>
                  <CheckCircle2 className="size-3.5 text-success" />
                  <span className="text-success">{slug} is available</span>
                </>
              )}
              {slugCheck === "unavailable" && (
                <>
                  <XCircle className="size-3.5 text-danger" />
                  <span className="text-danger">This slug is already taken</span>
                </>
              )}
            </div>
          </div>

          <Button className="w-full" onClick={handleStep1Continue} disabled={!canContinueStep1}>
            {creating ? "Creating…" : "Continue"}
          </Button>
        </div>
      </WizardCard>
    );
  }

  return (
    <WizardCard step={2} totalSteps={2} title="Invite your team" description="Optional — you can always invite people later.">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          {rows.map((row) => {
            const rowError = row.email.trim().length > 0 && !isValidEmail(row.email) ? "Invalid email" : undefined;
            return (
              <div key={row.id} className="flex items-start gap-2">
                <div className="flex-1">
                  <Input
                    value={row.email}
                    onChange={(e) => updateRow(row.id, { email: e.target.value })}
                    placeholder="teammate@company.com"
                    aria-invalid={Boolean(rowError)}
                  />
                  {rowError && <p className="mt-1 text-xs text-danger">{rowError}</p>}
                </div>
                <Select value={row.role} onValueChange={(value: TeamInvite["role"]) => updateRow(row.id, { role: value })}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="employee">Employee</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="ghost" size="icon-sm" onClick={() => removeRow(row.id)} aria-label="Remove row">
                  <Trash2 className="size-4" />
                </Button>
              </div>
            );
          })}
        </div>

        <Button variant="outline" size="sm" className="self-start" onClick={() => setRows((prev) => [...prev, createInviteRow()])}>
          <Plus className="size-3.5" />
          Add another
        </Button>

        <div className="flex flex-col gap-2 pt-2">
          <Button className="w-full" onClick={handleStep2Continue} disabled={!canContinueStep2}>
            {sendingInvites ? "Sending invites…" : "Continue"}
          </Button>
          <button
            type="button"
            onClick={finishOnboarding}
            className="text-center text-sm text-neutral-600 hover:text-neutral-950 hover:underline"
          >
            Skip for now
          </button>
        </div>
      </div>
    </WizardCard>
  );
}
