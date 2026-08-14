"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthCard } from "@/components/auth/auth-card";
import { QrPlaceholder } from "@/components/auth/qr-placeholder";
import { MfaCodeInput } from "@/components/auth/mfa-code-input";
import { BackupCodesGrid } from "@/components/auth/backup-codes-grid";
import { Button } from "@/components/ui/button";
import { mockVerifyMfaCode, type FieldErrors } from "@/lib/mock-auth";
import { useMockMfaEnabled } from "@/lib/use-mock-mfa";
import { toast } from "@/components/shared/toast";

// Illustrative-only demo secret — never a real, live TOTP seed.
const DUMMY_SECRET = "JBSWY3DPEHPK3PXP";
const MANUAL_KEY = DUMMY_SECRET.match(/.{1,4}/g)?.join(" ") ?? DUMMY_SECRET;

const BACKUP_CODES = [
  "4F8K-2NPQ",
  "7XW1-93RT",
  "QZ6L-40MC",
  "1JHB-58YV",
  "K3TE-77XS",
  "9RPD-21FG",
  "M0AC-64JL",
  "5WYQ-38KH",
  "T2VN-90ZD",
  "B7US-15RM",
];

type Step = "qr" | "confirm" | "backup-codes";

export default function MfaSetupPage() {
  const router = useRouter();
  const [, setMfaEnabled] = useMockMfaEnabled();
  const [step, setStep] = useState<Step>("qr");
  const [code, setCode] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  async function handleConfirm(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});
    const result = await mockVerifyMfaCode(code);
    setSubmitting(false);

    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    setMfaEnabled(true);
    setStep("backup-codes");
  }

  if (step === "qr") {
    return (
      <AuthCard title="Set up two-factor authentication" description="Scan this code with your authenticator app.">
        <div className="flex flex-col items-center gap-4">
          <QrPlaceholder seed={DUMMY_SECRET} />

          <div className="w-full">
            <p className="mb-1 text-xs font-medium text-neutral-600">Or enter this key manually</p>
            <p className="rounded-md border border-border bg-neutral-50 px-3 py-2 text-center font-mono text-sm text-neutral-950">
              {MANUAL_KEY}
            </p>
          </div>

          <Button className="w-full" onClick={() => setStep("confirm")}>
            I&apos;ve added this account
          </Button>
        </div>
      </AuthCard>
    );
  }

  if (step === "confirm") {
    return (
      <AuthCard title="Confirm setup" description="Enter the 6-digit code your authenticator app generated.">
        <form onSubmit={handleConfirm} className="flex flex-col gap-4">
          <MfaCodeInput value={code} onChange={setCode} error={errors.code} />
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Verifying…" : "Verify and enable"}
          </Button>
          <button
            type="button"
            onClick={() => setStep("qr")}
            className="text-sm text-neutral-600 hover:text-neutral-950 hover:underline"
          >
            Back
          </button>
        </form>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Save your backup codes" description="Two-factor authentication is now enabled.">
      <div className="flex flex-col gap-4">
        <BackupCodesGrid codes={BACKUP_CODES} />
        <Button
          className="w-full"
          onClick={() => {
            toast.success("Two-factor authentication enabled");
            router.push("/settings");
          }}
        >
          Done
        </Button>
      </div>
    </AuthCard>
  );
}
