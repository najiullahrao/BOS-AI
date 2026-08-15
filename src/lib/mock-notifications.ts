export type NotificationType =
  | "ticket_assigned"
  | "ticket_sla_breach"
  | "lead_assigned"
  | "org_invitation"
  | "billing_past_due"
  | "workflow_failed";

export interface AppNotification {
  id: string;
  type: NotificationType;
  message: string;
  read: boolean;
  createdAt: string;
  link: string;
}

export interface NotificationPreference {
  email: boolean;
  inApp: boolean;
}

const notificationStore: AppNotification[] = [
  {
    id: "n_1",
    type: "ticket_assigned",
    message: "Ticket \"Unable to export report to CSV\" was assigned to you",
    read: false,
    createdAt: "2026-07-11T08:00:00Z",
    link: "/tickets/tk_1",
  },
  {
    id: "n_2",
    type: "ticket_sla_breach",
    message: "SLA breach imminent on \"Integration webhook failing intermittently\"",
    read: false,
    createdAt: "2026-07-11T08:50:00Z",
    link: "/tickets/tk_4",
  },
  {
    id: "n_3",
    type: "lead_assigned",
    message: "New lead \"Priya Shah\" assigned to you",
    read: true,
    createdAt: "2026-07-10T09:00:00Z",
    link: "/crm/leads",
  },
  {
    id: "n_4",
    type: "billing_past_due",
    message: "Your last payment failed. Update your payment method.",
    read: false,
    createdAt: "2026-07-09T00:00:00Z",
    link: "/settings/billing",
  },
  {
    id: "n_5",
    type: "workflow_failed",
    message: "Workflow \"Deal Closed Won draft onboarding doc\" failed",
    read: true,
    createdAt: "2026-07-09T11:30:00Z",
    link: "/workflows",
  },
];

const listeners = new Set<() => void>();
let notificationsSnapshot: AppNotification[] = notificationStore.map((n) => ({ ...n }));

function emit() {
  notificationsSnapshot = notificationStore.map((n) => ({ ...n }));
  listeners.forEach((listener) => listener());
}

export function subscribeNotifications(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getNotificationsSnapshot(): AppNotification[] {
  return notificationsSnapshot;
}

export function getUnreadCount(): number {
  return notificationStore.filter((n) => !n.read).length;
}

export function markNotificationRead(id: string): void {
  const target = notificationStore.find((n) => n.id === id);
  if (target && !target.read) target.read = true;
  emit();
}

export function markAllNotificationsRead(): void {
  notificationStore.forEach((n) => {
    n.read = true;
  });
  emit();
}

const DEFAULT_PREFERENCES: Record<NotificationType, NotificationPreference> = {
  ticket_assigned: { email: true, inApp: true },
  ticket_sla_breach: { email: true, inApp: true },
  lead_assigned: { email: false, inApp: true },
  org_invitation: { email: true, inApp: true },
  billing_past_due: { email: true, inApp: true },
  workflow_failed: { email: false, inApp: true },
};

const preferenceStore: Record<NotificationType, NotificationPreference> = {
  ...DEFAULT_PREFERENCES,
};

export function getNotificationPreferences(): Record<NotificationType, NotificationPreference> {
  const copy = {} as Record<NotificationType, NotificationPreference>;
  for (const key of Object.keys(preferenceStore) as NotificationType[]) {
    copy[key] = { ...preferenceStore[key] };
  }
  return copy;
}

export function saveNotificationPreferences(
  prefs: Record<NotificationType, NotificationPreference>
): void {
  for (const key of Object.keys(prefs) as NotificationType[]) {
    preferenceStore[key] = { ...prefs[key] };
  }
}

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  ticket_assigned: "Ticket assigned",
  ticket_sla_breach: "SLA breach warning",
  lead_assigned: "Lead assigned",
  org_invitation: "Organization invitation",
  billing_past_due: "Payment past due",
  workflow_failed: "Workflow failed",
};

export const NOTIFICATION_TYPES = Object.keys(DEFAULT_PREFERENCES) as NotificationType[];
