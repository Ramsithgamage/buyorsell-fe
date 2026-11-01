import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  CheckCheck,
  Package,
  ShoppingBag,
  Truck,
  XCircle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { NotificationType } from "@/hooks/use-notifications";

// ── Types ──────────────────────────────────────────────────────────────────────

interface Notification {
  id: number;
  type: NotificationType;
  title: string;
  body: string;
  orderId: number | null;
  readAt: string | null;
  createdAt: string;
}

interface PaginatedNotifications {
  data: Notification[];
  meta: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    itemCount: number;
  };
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const TYPE_FILTERS: { label: string; value: NotificationType | "ALL" }[] = [
  { label: "All", value: "ALL" },
  { label: "Order Placed", value: "ORDER_PLACED" },
  { label: "Shipped", value: "ORDER_SHIPPED" },
  { label: "Cancelled", value: "ORDER_CANCELLED" },
];

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

function typeBadge(type: NotificationType) {
  const labels: Record<NotificationType, string> = {
    ORDER_PLACED: "Order Placed",
    ORDER_SHIPPED: "Shipped",
    ORDER_CANCELLED: "Cancelled",
    ORDER_DELIVERED: "Delivered",
  };
  const isDestructive = type === "ORDER_CANCELLED";
  return (
    <Badge
      variant="outline"
      className={cn(
        "text-[10px] px-1.5 py-0 h-4",
        isDestructive
          ? "border-destructive/30 bg-destructive/10 text-destructive"
          : "border-brand/30 bg-brand/10 text-brand",
      )}
    >
      {labels[type]}
    </Badge>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function NotificationsHistoryDashboard() {
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState<NotificationType | "ALL">("ALL");
  const queryClient = useQueryClient();

  // Build the query string
  const queryString = [
    `page=${page}`,
    `limit=20`,
    typeFilter !== "ALL" ? `type=${typeFilter}` : "",
  ]
    .filter(Boolean)
    .join("&");

  const { data, isLoading } = useQuery<PaginatedNotifications>({
    queryKey: ["notifications", "history", page, typeFilter],
    queryFn: () => api(`/notifications?${queryString}`),
  });

  const notifications = data?.data ?? [];
  const meta = data?.meta;

  // ── Mark all read ──────────────────────────────────────────────────────────

  const handleMarkAllRead = async () => {
    try {
      await api("/notifications/read-all", { method: "PATCH" });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("All notifications marked as read.");
    } catch {
      toast.error("Failed to mark notifications as read.");
    }
  };

  // ── Mark single read ───────────────────────────────────────────────────────

  const handleMarkRead = async (id: number) => {
    try {
      await api(`/notifications/${id}/read`, { method: "PATCH" });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    } catch {
      toast.error("Failed to mark notification as read.");
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  const unreadCount = notifications.filter((n) => n.readAt === null).length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Bell className="h-6 w-6 text-brand" />
            Notifications
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Your full notification history.
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 shrink-0"
            onClick={handleMarkAllRead}
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Mark all as read
          </Button>
        )}
      </div>

      {/* Type filter pills */}
      <div className="flex items-center gap-2 flex-wrap">
        {TYPE_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => {
              setTypeFilter(f.value);
              setPage(1);
            }}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              typeFilter === f.value
                ? "bg-brand text-brand-foreground border-brand"
                : "bg-background text-muted-foreground border-border hover:border-brand/40 hover:text-foreground",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="rounded-lg border bg-card overflow-hidden">
        {isLoading ? (
          <div className="divide-y divide-border">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-3 px-4 py-4 animate-pulse">
                <div className="h-4 w-4 rounded-full bg-muted shrink-0 mt-0.5" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-3/4 rounded bg-muted" />
                  <div className="h-2.5 w-1/3 rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <Bell className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">
              No notifications
              {typeFilter !== "ALL" ? " for this filter" : " yet"}.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {notifications.map((n) => {
              const isUnread = n.readAt === null;
              const timeAgo = formatDistanceToNow(new Date(n.createdAt), {
                addSuffix: true,
              });
              return (
                <div
                  key={n.id}
                  className={cn(
                    "flex items-start gap-3 px-4 py-3.5 transition-colors",
                    isUnread && "bg-brand/5",
                  )}
                >
                  {/* Unread dot */}
                  <span
                    className={cn(
                      "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full",
                      isUnread ? "bg-brand" : "bg-transparent",
                    )}
                  />

                  {/* Icon */}
                  <div className="mt-0.5">{typeIcon(n.type)}</div>

                  {/* Text */}
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      {typeBadge(n.type)}
                      <span className="text-[11px] text-muted-foreground">
                        {timeAgo}
                      </span>
                    </div>
                    <p className="text-sm text-foreground leading-snug">
                      {n.body}
                    </p>
                  </div>

                  {/* Mark-as-read */}
                  {isUnread && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-muted-foreground hover:text-brand shrink-0"
                      onClick={() => handleMarkRead(n.id)}
                    >
                      Mark read
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Showing{" "}
            {(meta.currentPage - 1) * meta.itemsPerPage + 1}–
            {Math.min(meta.currentPage * meta.itemsPerPage, meta.totalItems)}{" "}
            of {meta.totalItems}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2"
              disabled={meta.currentPage <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              ← Prev
            </Button>
            <span className="px-2 text-xs font-medium">
              {meta.currentPage} / {meta.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2"
              disabled={meta.currentPage >= meta.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next →
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

