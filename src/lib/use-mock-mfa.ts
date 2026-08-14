"use client";

import { useSyncExternalStore } from "react";

const STORAGE_KEY = "aibos_demo_mfa_enabled";
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

/** Demo-only persistence so the MFA setup flow and Security tab agree on state across navigation. */
export function useMockMfaEnabled(): [boolean, (value: boolean) => void] {
  const enabled = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  function update(value: boolean) {
    window.localStorage.setItem(STORAGE_KEY, String(value));
    listeners.forEach((listener) => listener());
  }

  return [enabled, update];
}
