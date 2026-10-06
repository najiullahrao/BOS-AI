"use client";

import { useSyncExternalStore } from "react";

const STORAGE_KEY = "bos-ai:platform-admin-enabled";
export const PLATFORM_ADMIN_STORAGE_KEY = STORAGE_KEY;
export const ADMIN_PIN = "8471";

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

export function isPlatformAdminEnabled(): boolean {
  return window.localStorage.getItem(STORAGE_KEY) === "true";
}

export function usePlatformAdmin(): [boolean, (enabled: boolean) => void] {
  const enabled = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  function setPlatformAdminEnabled(next: boolean) {
    if (next) {
      window.localStorage.setItem(STORAGE_KEY, "true");
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
    listeners.forEach((listener) => listener());
  }

  return [enabled, setPlatformAdminEnabled];
}