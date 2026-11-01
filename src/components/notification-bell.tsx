import { Bell, Check, CheckCheck, Package, ShoppingBag, Truck, XCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useNotifications, type Notification, type NotificationType } from "@/hooks/use-notifications";

// ── Helpers ────────────────────────────────────────────────────────────────────

function typeIcon(type: NotificationType) {
  switch (type) {
    case "ORDER_PLACED":
      return <ShoppingBag className="h-4 w-4 text-brand shrink-0" />;
    case "ORDER_SHIPPED":
      return <Truck className="h-4 w-4 text-brand shrink-0" />;
    case "ORDER_CANCELLED":
      return <XCircle className="h-4 w-4 text-destructive shrink-0" />;
    case "ORDER_DELIVERED":
      return <Package className="h-4 w-4 text-brand shrink-0" />;
  }
}

function BadgeCount({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <span className="absolute -top-1 -right-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-destructive px-0.5 text-[10px] font-semibold text-destructive-foreground leading-none">
      {count > 99 ? "99+" : count}
    </span>
  );
}

// ── Notification row ───────────────────────────────────────────────────────────

function NotificationRow({
  notification,
  onMarkRead,
}: {
  notification: Notification;
  onMarkRead: (id: number) => void;
}) {
  const isUnread = notification.readAt === null;
  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), {
    addSuffix: true,
  });

  return (
    <div
      className={cn(
        "flex items-start gap-3 px-4 py-3 transition-colors",
        isUnread && "bg-brand/5",
      )}
    >
      {/* Type icon */}
      <div className="mt-0.5">{typeIcon(notification.type)}</div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="text-sm leading-snug text-foreground line-clamp-2">
          {notification.body}
        </p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">{timeAgo}</p>
      </div>

      {/* Mark-as-read button (only when unread) */}
      {isUnread && (
        <button
          onClick={() => onMarkRead(notification.id)}
          title="Mark as read"
          className="mt-0.5 shrink-0 text-muted-foreground hover:text-brand transition-colors"
        >
          <Check className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

interface NotificationBellProps {
  /** Pass true only when the user is authenticated */
  enabled: boolean;
}

export function NotificationBell({ enabled }: NotificationBellProps) {
  const { notifications, unreadCount, initialised, markAsRead, markAllRead } =
    useNotifications(enabled);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          id="notification-bell"
          aria-label="Notifications"
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-md border border-input bg-background text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
        >
          <Bell className="h-4 w-4" />
          <BadgeCount count={unreadCount} />
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-80 p-0 shadow-lg"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="text-sm font-semibold flex items-center gap-1.5">
            <Bell className="h-3.5 w-3.5" />
            Notifications
            {unreadCount > 0 && (
              <span className="ml-1 text-xs font-normal text-muted-foreground">
                ({unreadCount} unread)
              </span>
            )}
          </h3>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-brand transition-colors"
            >
              <CheckCheck className="h-3 w-3" />
              Mark all read
            </button>
          )}
        </div>

        {/* List */}
        <ScrollArea className="max-h-80">
          {!initialised ? (
            /* Loading skeleton */
            <div className="space-y-1 p-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3 px-2 py-2 animate-pulse">
                  <div className="h-4 w-4 rounded-full bg-muted shrink-0 mt-0.5" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 w-3/4 rounded bg-muted" />
                    <div className="h-2.5 w-1/2 rounded bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center px-4">
              <Bell className="h-8 w-8 text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground">No notifications yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {notifications.map((n) => (
                <NotificationRow
                  key={n.id}
                  notification={n}
                  onMarkRead={markAsRead}
                />
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        {notifications.length > 0 && (
          <>
            <Separator />
            <div className="px-4 py-2.5 text-center">
              <a
                href="/dashboard?tab=notifications"
                className="text-xs text-muted-foreground hover:text-brand transition-colors"
              >
                View all notifications →
              </a>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}

