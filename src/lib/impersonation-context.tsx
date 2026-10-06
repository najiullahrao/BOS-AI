"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { IMPERSONATION_SESSION_SECONDS } from "@/lib/mock-admin";
import { toast } from "@/components/shared/toast";

export interface ImpersonationTarget {
  userId: string;
  userName: string;
  userEmail: string;
  orgName: string;
}

interface ImpersonationContextValue {
  target: ImpersonationTarget | null;
  remainingSeconds: number;
  startImpersonation: (target: ImpersonationTarget) => void;
  endImpersonation: () => void;
}

const ImpersonationContext = createContext<ImpersonationContextValue | null>(null);

// TODO: persist across hard page reloads once a real backend session exists.
// The current mock keeps impersonation state in React only, so a full page
// reload resets the banner. A persistent session (cookie/localStorage with
// server validation) should restore the countdown on mount instead.
const TEST_SECONDS_KEY = "__test_impersonation_seconds";

function getSessionSeconds(): number {
  if (typeof window === "undefined") return IMPERSONATION_SESSION_SECONDS;
  const override = Number(window.localStorage.getItem(TEST_SECONDS_KEY));
  return override > 0 && override <= 60 ? override : IMPERSONATION_SESSION_SECONDS;
}

export function ImpersonationProvider({ children }: { children: React.ReactNode }) {
  const [target, setTarget] = useState<ImpersonationTarget | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(IMPERSONATION_SESSION_SECONDS);

  useEffect(() => {
    if (!target) return;
    const intervalId = setInterval(() => {
      setRemainingSeconds((seconds) => {
        if (seconds <= 1) {
          clearInterval(intervalId);
          return 0;
        }
        return seconds - 1;
      });
    }, 1000);
    return () => clearInterval(intervalId);
  }, [target]);

  useEffect(() => {
    if (!target || remainingSeconds > 0) return;
    const timeoutId = window.setTimeout(() => {
      setTarget(null);
      setRemainingSeconds(getSessionSeconds());
      toast.info("Impersonation session expired.");
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [target, remainingSeconds]);

  return (
    <ImpersonationContext.Provider
      value={{
        target,
        remainingSeconds,
        startImpersonation: (next) => {
          setTarget(next);
          setRemainingSeconds(getSessionSeconds());
        },
        endImpersonation: () => {
          setTarget(null);
          setRemainingSeconds(getSessionSeconds());
        },
      }}
    >
      {children}
    </ImpersonationContext.Provider>
  );
}

export function useImpersonation(): ImpersonationContextValue {
  const context = useContext(ImpersonationContext);
  if (!context) {
    throw new Error("useImpersonation must be used within an ImpersonationProvider");
  }
  return context;
}

export function impersonationCountdownLabel(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}
