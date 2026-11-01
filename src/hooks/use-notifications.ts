import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";

// ── Types ──────────────────────────────────────────────────────────────────────

export type NotificationType =
  | "ORDER_PLACED"
  | "ORDER_SHIPPED"
  | "ORDER_CANCELLED"
  | "ORDER_DELIVERED";

export interface Notification {
  id: number;
  type: NotificationType;
  title: string;
  body: string;
  orderId: number | null;
  readAt: string | null; // ISO string, null = unread
  createdAt: string;
}

// ── Hook ───────────────────────────────────────────────────────────────────────

const SSE_BACKOFF_BASE_MS = 2_000;
const SSE_BACKOFF_MAX_MS = 30_000;

/**
 * Manages in-app notifications for the logged-in user.
 *
 * - Fetches the initial unread count via REST on mount.
 * - Fetches the latest 20 notifications for the dropdown via REST.
 * - Opens an SSE stream (authenticated via a short-lived ticket) to receive
 *   real-time pushes. Reconnects automatically with exponential backoff.
 * - Exposes markAsRead / markAllRead helpers that update local state
 *   optimistically and call the API in the background.
 */
export function useNotifications(enabled: boolean) {
  const queryClient = useQueryClient();

  // ── Local notification list (SSE + initial fetch merged) ──────────────────

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [initialised, setInitialised] = useState(false);

  // ── Initial REST fetch ─────────────────────────────────────────────────────

  const { data: fetchedNotifications } = useQuery<{ data: Notification[] }>({
    queryKey: ["notifications", "list"],
    queryFn: () => api("/notifications?limit=20"),
    enabled,
    staleTime: 60_000,
  });

  const { data: countData } = useQuery<{ count: number }>({
    queryKey: ["notifications", "unread-count"],
    queryFn: () => api("/notifications/unread-count"),
    enabled,
    staleTime: 30_000,
  });

  // Seed local state once the REST data lands
  useEffect(() => {
    if (!fetchedNotifications) return;
    setNotifications(fetchedNotifications.data);
    setInitialised(true);
  }, [fetchedNotifications]);

  useEffect(() => {
    if (countData !== undefined) setUnreadCount(countData.count);
  }, [countData]);

  // ── SSE connection ─────────────────────────────────────────────────────────

  const esRef = useRef<EventSource | null>(null);
  const retryCountRef = useRef(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connect = useCallback(async () => {
    // Don't open a second connection
    if (esRef.current && esRef.current.readyState !== EventSource.CLOSED) return;

    const token = localStorage.getItem("access_token");
    if (!token) return; // not logged in

    // Fetch a short-lived ticket
    let ticket: string;
    try {
      const res = await api("/notifications/stream-ticket", { method: "POST" });
      ticket = (res as { ticket: string }).ticket;
    } catch {
      // Cannot get a ticket (e.g. server down) — schedule a retry
      scheduleRetry();
      return;
    }

    const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
    const es = new EventSource(`${API_BASE_URL}/notifications/stream?ticket=${ticket}`);
    esRef.current = es;

    es.onmessage = (event) => {
      retryCountRef.current = 0; // successful message resets backoff

      let notification: Notification;
      try {
        notification = JSON.parse(event.data) as Notification;
      } catch {
        return;
      }

      // Prepend to the local list (capped at 20 for the dropdown)
      setNotifications((prev) => [notification, ...prev].slice(0, 20));
      setUnreadCount((c) => c + 1);

      // Toast to surface the notification immediately
      toast.info(notification.title, { description: notification.body });
    };

    es.onerror = () => {
      es.close();
      esRef.current = null;
      scheduleRetry();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const scheduleRetry = useCallback(() => {
    if (retryTimerRef.current) return; // already scheduled
    const delay = Math.min(
      SSE_BACKOFF_BASE_MS * 2 ** retryCountRef.current,
      SSE_BACKOFF_MAX_MS,
    );
    retryCountRef.current += 1;
    retryTimerRef.current = setTimeout(() => {
      retryTimerRef.current = null;
      connect();
    }, delay);
  }, [connect]);

  useEffect(() => {
    if (!enabled) return;
    connect();

    return () => {
      esRef.current?.close();
      esRef.current = null;
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    };
  }, [enabled, connect]);

  // ── Actions ────────────────────────────────────────────────────────────────

  const markAsRead = useCallback(
    async (id: number) => {
      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, readAt: new Date().toISOString() } : n,
        ),
      );
      setUnreadCount((c) => Math.max(0, c - 1));

      try {
        await api(`/notifications/${id}/read`, { method: "PATCH" });
        queryClient.invalidateQueries({ queryKey: ["notifications"] });
      } catch {
        // Revert on failure
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, readAt: null } : n)),
        );
        setUnreadCount((c) => c + 1);
      }
    },
    [queryClient],
  );

  const markAllRead = useCallback(async () => {
    const now = new Date().toISOString();

    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? now })));
    setUnreadCount(0);

    try {
      await api("/notifications/read-all", { method: "PATCH" });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    } catch {
      // Revert: restore original readAt values from server state
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    }
  }, [queryClient]);

  return {
    notifications,
    unreadCount,
    initialised,
    markAsRead,
    markAllRead,
  };
}

