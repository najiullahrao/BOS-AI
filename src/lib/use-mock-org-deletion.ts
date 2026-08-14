"use client";

import { useSyncExternalStore } from "react";

const STORAGE_KEY = "aibos_demo_org_deleted_at";
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
  return window.localStorage.getItem(STORAGE_KEY);
}

function getServerSnapshot() {
  return null;
}

/** Demo-only persistence: an ISO timestamp when deletion was requested, or null if not scheduled. */
export function useMockOrgDeletion(): [string | null, (deletedAt: string | null) => void] {
  const deletedAt = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  function update(value: string | null) {
    if (value) {
      window.localStorage.setItem(STORAGE_KEY, value);
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
    listeners.forEach((listener) => listener());
  }

  return [deletedAt, update];
}
