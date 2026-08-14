"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthCard } from "@/components/auth/auth-card";
import { OAuthButtons } from "@/components/auth/oauth-buttons";
import { PasswordInput } from "@/components/auth/password-input";
import { MfaCodeInput } from "@/components/auth/mfa-code-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { mockLogin, mockVerifyMfaCode, MFA_TEST_ACCOUNT_EMAIL, type FieldErrors } from "@/lib/mock-auth";
import { toast } from "@/components/shared/toast";

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<"password" | "mfa">("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});
    const result = await mockLogin({ email, password });
    setSubmitting(false);

    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    if (result.mfaRequired) {
      setStep("mfa");
      return;
    }
    toast.success("Logged in");
    router.push("/dashboard");
  }

  async function handleMfaSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});
    const result = await mockVerifyMfaCode(code);
    setSubmitting(false);

    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    toast.success("Logged in");
    router.push("/dashboard");
  }

  if (step === "mfa") {
    return (
      <AuthCard title="Enter your 6-digit code" description="Open your authenticator app to get your verification code.">
        <form onSubmit={handleMfaSubmit} className="flex flex-col gap-4">
          <MfaCodeInput value={code} onChange={setCode} error={errors.code} />
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Verifying…" : "Verify"}
          </Button>
          <button
            type="button"
            onClick={() => {
              setStep("password");
              setCode("");
              setErrors({});
            }}
            className="text-sm text-neutral-600 hover:text-neutral-950 hover:underline"
          >
            Back to log in
          </button>
        </form>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Log in to AI-BOS"
      description="Welcome back"
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-medium text-primary hover:underline">
            Create one
          </Link>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <OAuthButtons />

        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-neutral-600">or</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="text"
              inputMode="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={Boolean(errors.email)}
            />
            {errors.email && <p className="text-xs text-danger">{errors.email}</p>}
            <p className="text-xs text-neutral-600">
              Try <span className="font-mono">{MFA_TEST_ACCOUNT_EMAIL}</span> to preview the MFA step.
            </p>
          </div>

          <PasswordInput
            label="Password"
            value={password}
            onChange={setPassword}
            autoComplete="current-password"
            error={errors.password}
            labelAction={
              <Link href="/forgot-password" className="text-xs font-medium text-primary hover:underline">
                Forgot password?
              </Link>
            }
          />

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Logging in…" : "Log in"}
          </Button>
        </form>
      </div>
    </AuthCard>
  );
}
