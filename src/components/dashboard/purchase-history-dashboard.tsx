import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  ShoppingBag,
  Truck,
  XCircle,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { Button } from "@/components/ui/button";

// ── Types ─────────────────────────────────────────────────────────────────────

interface OrderAd {
  id: number;
  title: string;
  slug: string;
}

interface OrderUser {
  id: number;
  firstName: string;
  lastName: string;
}

type OrderStatus = "PENDING" | "SHIPPED" | "CANCELLED";

interface PlacedOrder {
  id: number;
  adId: number;
  quantity: number;
  address: string;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  ad?: OrderAd;
  seller?: OrderUser;
}

interface PaginatedOrders {
  data: PlacedOrder[];
  meta: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

// ── Component ─────────────────────────────────────────────────────────────────

export function PurchaseHistoryDashboard() {
  const [activeOrdersPage, setActiveOrdersPage] = useState(1);
  const [cancelledOrdersPage, setCancelledOrdersPage] = useState(1);
  const queryClient = useQueryClient();

  // ── Mutations ───────────────────────────────────────────────────────────────

  const cancelOrderMutation = useMutation({
    mutationFn: (orderId: number) =>
      api(`/orders/${orderId}/cancel`, { method: "PATCH" }),
    onSuccess: () => {
      toast.success("Order cancelled.");
      queryClient.invalidateQueries({ queryKey: ["orders-placed"] });
    },
    onError: (err: Error) =>
      toast.error(err.message || "Failed to cancel order."),
  });

  // ── Queries ─────────────────────────────────────────────────────────────────

  // Active orders: PENDING and SHIPPED (no status filter → backend returns all non-cancelled)
  const { data: activeOrders, isLoading: activeOrdersLoading } =
    useQuery<PaginatedOrders>({
      queryKey: ["orders-placed", "active", activeOrdersPage],
      queryFn: () =>
        api(`/orders/placed?page=${activeOrdersPage}&limit=10`),
    });

  // Cancelled orders
  const { data: cancelledOrders, isLoading: cancelledOrdersLoading } =
    useQuery<PaginatedOrders>({
      queryKey: ["orders-placed", "cancelled", cancelledOrdersPage],
      queryFn: () =>
        api(
          `/orders/placed?status=CANCELLED&page=${cancelledOrdersPage}&limit=10`,
        ),
    });

  // ── Column definitions ──────────────────────────────────────────────────────

  const activeOrderColumns: Column<Record<string, unknown>>[] = [
    {
      key: "ad",
      label: "Ad",
      render: (row) => {
        const ad = row.ad as OrderAd | undefined;
        return ad ? (
          <Link
            to="/listing/$id"
            params={{ id: String(ad.id) }}
            className="font-medium line-clamp-1 max-w-[200px] hover:text-brand hover:underline inline-flex items-center gap-1"
          >
            {ad.title}
            <ExternalLink className="h-3 w-3 shrink-0 opacity-60" />
          </Link>
        ) : (
          <span className="text-muted-foreground text-xs">—</span>
        );
      },
    },
    {
      key: "seller",
      label: "Seller",
      render: (row) => {
        const seller = row.seller as OrderUser | undefined;
        return seller ? (
          <span className="text-sm">
            {seller.firstName} {seller.lastName}
          </span>
        ) : (
          <span className="text-muted-foreground text-xs">—</span>
        );
      },
    },
    {
      key: "quantity",
      label: "Qty",
      render: (row) => (
        <span className="tabular-nums text-sm">{String(row.quantity)}</span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (row) => {
        const s = row.status as OrderStatus;
        if (s === "PENDING")
          return (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400">
              <Truck className="h-3 w-3" /> Pending
            </span>
          );
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-brand">
            <Truck className="h-3 w-3" /> Shipped
          </span>
        );
      },
    },
    {
      key: "createdAt",
      label: "Placed On",
      render: (row) => (
        <span className="text-xs text-muted-foreground">
          {new Date(String(row.createdAt)).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: "actions",
      label: "",
      render: (row) =>
        row.status === "PENDING" ? (
          <Button
            id={`cancel-order-${row.id}`}
            size="sm"
            variant="outline"
            className="h-7 gap-1.5 text-xs border-destructive/30 text-destructive hover:bg-destructive/10"
            disabled={cancelOrderMutation.isPending}
            onClick={() => cancelOrderMutation.mutate(Number(row.id))}
          >
            <XCircle className="h-3.5 w-3.5" />
            Cancel
          </Button>
        ) : null,
    },
  ];

  const cancelledOrderColumns: Column<Record<string, unknown>>[] = [
    {
      key: "ad",
      label: "Ad",
      render: (row) => {
        const ad = row.ad as OrderAd | undefined;
        return ad ? (
          <Link
            to="/listing/$id"
            params={{ id: String(ad.id) }}
            className="font-medium line-clamp-1 max-w-[200px] hover:text-brand hover:underline inline-flex items-center gap-1"
          >
            {ad.title}
            <ExternalLink className="h-3 w-3 shrink-0 opacity-60" />
          </Link>
        ) : (
          <span className="text-muted-foreground text-xs">—</span>
        );
      },
    },
    {
      key: "seller",
      label: "Seller",
      render: (row) => {
        const seller = row.seller as OrderUser | undefined;
        return seller ? (
          <span className="text-sm">
            {seller.firstName} {seller.lastName}
          </span>
        ) : (
          <span className="text-muted-foreground text-xs">—</span>
        );
      },
    },
    {
      key: "quantity",
      label: "Qty",
      render: (row) => (
        <span className="tabular-nums text-sm">{String(row.quantity)}</span>
      ),
    },
    {
      key: "updatedAt",
      label: "Cancelled On",
      render: (row) => (
        <span className="text-xs text-muted-foreground">
          {new Date(String(row.updatedAt)).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: () => (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-destructive">
          <XCircle className="h-3 w-3" /> Cancelled
        </span>
      ),
    },
  ];

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <ShoppingBag className="h-6 w-6 text-brand" />
          Purchase History
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Track all orders you have placed on the marketplace.
        </p>
      </div>

      {/* Active Orders */}
      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Active Orders
        </h2>
        <DataTable
          columns={activeOrderColumns}
          data={
            (activeOrders?.data as unknown as Record<string, unknown>[]) ?? []
          }
          meta={activeOrders?.meta}
          onPageChange={setActiveOrdersPage}
          isLoading={activeOrdersLoading}
          emptyMessage="You haven't placed any orders yet."
        />
      </section>

      {/* Cancelled Orders */}
      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Cancelled Orders
        </h2>
        <DataTable
          columns={cancelledOrderColumns}
          data={
            (cancelledOrders?.data as unknown as Record<
              string,
              unknown
            >[]) ?? []
          }
          meta={cancelledOrders?.meta}
          onPageChange={setCancelledOrdersPage}
          isLoading={cancelledOrdersLoading}
          emptyMessage="No cancelled orders."
        />
      </section>
    </div>
  );
}
