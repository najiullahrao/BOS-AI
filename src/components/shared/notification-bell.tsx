"use client";

import { useRouter } from "next/navigation";
import { Bell, CheckCheck, CreditCard, Ticket, User, UserPlus, Zap, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useNotifications } from "@/lib/use-mock-notifications";
import { markAllNotificationsRead, markNotificationRead, type NotificationType } from "@/lib/mock-notifications";
import { formatRelativeTime } from "@/lib/mock-crm";

const TYPE_ICONS: Record<NotificationType, LucideIcon> = {
  ticket_assigned: Ticket,
  ticket_sla_breach: Ticket,
  lead_assigned: User,
  org_invitation: UserPlus,
  billing_past_due: CreditCard,
  workflow_failed: Zap,
};

export function NotificationBell() {
  const router = useRouter();
  const notifications = useNotifications();
  const unreadCount = notifications.filter((n) => !n.read).length;

  function handleOpenNotification(id: string, link: string) {
    markNotificationRead(id);
    router.push(link);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" className="relative" aria-label={`Notifications (${unreadCount} unread)`}>
          <Bell className="size-4" />
          {unreadCount > 0 && (
            <span
              aria-hidden="true"
              className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold leading-none text-white"
            >
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={() => markAllNotificationsRead()}
              className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              <CheckCheck className="size-3.5" />
              Mark all read
            </button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-neutral-600">No notifications yet.</p>
        ) : (
          notifications.map((notification) => {
            const Icon = TYPE_ICONS[notification.type];
            const unread = !notification.read;
            return (
              <DropdownMenuItem
                key={notification.id}
                onSelect={() => handleOpenNotification(notification.id, notification.link)}
                className={cn(
                  "items-start gap-3 rounded-md px-3 py-2.5",
                  unread && "border-l-2 border-primary bg-primary/5"
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md",
                    unread ? "bg-primary/10 text-primary" : "bg-neutral-100 text-neutral-600"
                  )}
                >
                  <Icon className="size-3.5" aria-hidden="true" />
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className={cn("text-sm", unread ? "font-semibold text-neutral-950" : "text-neutral-600")}>
                    {notification.message}
                  </span>
                  <span className="text-xs text-neutral-600">{formatRelativeTime(notification.createdAt)}</span>
                </span>
              </DropdownMenuItem>
            );
          })
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
