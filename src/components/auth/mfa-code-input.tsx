"use client";

import { useId } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface MfaCodeInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  label?: string;
}

export function MfaCodeInput({ value, onChange, error, label = "6-digit code" }: MfaCodeInputProps) {
  const id = useId();

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        placeholder="000000"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
        aria-invalid={Boolean(error)}
        className="h-11 text-center font-mono text-lg tracking-[0.5em]"
      />
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
