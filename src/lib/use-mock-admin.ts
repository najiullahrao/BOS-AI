"use client";

import { useSyncExternalStore } from "react";
import {
  subscribeAdminOrgs,
  getAdminOrgsSnapshot,
  subscribeFeatureFlags,
  getFeatureFlagsSnapshot,
} from "@/lib/mock-admin";

export function useAdminOrgs() {
  const orgs = useSyncExternalStore(subscribeAdminOrgs, getAdminOrgsSnapshot);
  return { orgs };
}

export function useFeatureFlags() {
  const flags = useSyncExternalStore(subscribeFeatureFlags, getFeatureFlagsSnapshot);
  return { flags };
}