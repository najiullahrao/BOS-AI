"use client";

import { useSyncExternalStore } from "react";
import { getNotificationsSnapshot, subscribeNotifications } from "@/lib/mock-notifications";

/** Live view of the in-memory notification store. Re-renders on mark-as-read changes. */
export function useNotifications() {
  return useSyncExternalStore(subscribeNotifications, getNotificationsSnapshot, getNotificationsSnapshot);
}
