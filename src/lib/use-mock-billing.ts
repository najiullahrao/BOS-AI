"use client";

import { useSyncExternalStore } from "react";

const STORAGE_KEY = "bos-ai:billing:past-due";
const listeners = new Set<() => void>();

function subscribe(callback: () => void) {
  listeners.add(callback);
  window.addEventListener("storage", callback);
  return () => {
    listeners.delete(callback);
    window.removeEventListener("storage", callback);
  };
}

function getSnapshot() {
  return window.localStorage.getItem(STORAGE_KEY) === "true";
}

function getServerSnapshot() {
  return false;
}

/**
 * Demo-only persistence: whether the account is in a simulated past-due
 * state. Live across all pages via the shared in-app past-due banner.
 */
export function useBillingPastDue(): [boolean, (enabled: boolean) => void] {
  const pastDue = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  function setPastDue(enabled: boolean) {
    window.localStorage.setItem(STORAGE_KEY, enabled ? "true" : "false");
    listeners.forEach((listener) => listener());
  }

  return [pastDue, setPastDue];
}
