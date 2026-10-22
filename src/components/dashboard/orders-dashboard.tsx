import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  Package,
  Truck,
  XCircle,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// ── Types ─────────────────────────────────────────────────────────────────────

interface OrderUser {
  id: number;
  firstName: string;
  lastName: string;
}

interface OrderAd {
  id: number;
  title: string;
  slug: string;
}

interface Order {
  id: number;
  adId: number;
  buyerId: number;
  sellerId: number;
  quantity: number;
  address: string;
  message: string | null;
  status: "PENDING" | "SHIPPED" | "CANCELLED";
  createdAt: string;
  updatedAt: string;
  ad?: OrderAd;
  buyer?: OrderUser;
}

interface PaginatedOrders {
  data: Order[];
  meta: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function statusBadge(status: Order["status"]) {
  if (status === "PENDING")
    return (
      <Badge variant="outline" className="border-amber-400/40 bg-amber-400/10 text-amber-600 dark:text-amber-400">
        Pending
      </Badge>
    );
  if (status === "SHIPPED")
    return (
      <Badge variant="outline" className="border-brand/30 bg-brand/10 text-brand">
        Shipped
      </Badge>
    );
  return (
    <Badge variant="outline" className="border-destructive/30 bg-destructive/10 text-destructive">
      Cancelled
    </Badge>
  );
}

// ── Sub-table for each tab ────────────────────────────────────────────────────

function OrdersTable({
  status,
}: {
  status: "PENDING" | "SHIPPED" | "CANCELLED";
}) {
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<PaginatedOrders>({
    queryKey: ["orders-received", status, page],
    queryFn: () =>
      api(`/orders/received?status=${status}&page=${page}&limit=10`),
  });

  const shipMutation = useMutation({
    mutationFn: (orderId: number) =>
      api(`/orders/${orderId}/ship`, { method: "PATCH" }),
    onSuccess: () => {
      toast.success("Order marked as shipped.");
      queryClient.invalidateQueries({ queryKey: ["orders-received"] });
    },
    onError: (err: Error) =>
      toast.error(err.message || "Failed to ship order."),
  });

  // ── Column definitions ─────────────────────────────────────────────────────

  const baseColumns: Column<Record<string, unknown>>[] = [
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
      key: "buyer",
      label: "Buyer",
      render: (row) => {
        const buyer = row.buyer as OrderUser | undefined;
        return buyer ? (
          <span className="text-sm">
            {buyer.firstName} {buyer.lastName}
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
      key: "address",
      label: "Address",
      render: (row) => (
        <span className="text-xs text-muted-foreground line-clamp-1 max-w-[180px]">
          {String(row.address)}
        </span>
      ),
    },
  ];

  const pendingColumns: Column<Record<string, unknown>>[] = [
    ...baseColumns,
    {
      key: "message",
      label: "Message",
      render: (row) =>
        row.message ? (
          <span className="text-xs text-muted-foreground line-clamp-1 max-w-[160px]">
            {String(row.message)}
          </span>
        ) : (
          <span className="text-muted-foreground text-xs">—</span>
        ),
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
      render: (row) => (
        <Button
          id={`ship-order-${row.id}`}
          size="sm"
          className="h-7 gap-1.5 bg-brand text-brand-foreground hover:bg-brand/90 text-xs"
          disabled={shipMutation.isPending}
          onClick={() => shipMutation.mutate(Number(row.id))}
        >
          <Truck className="h-3.5 w-3.5" />
          Ship
        </Button>
      ),
    },
  ];

  const shippedColumns: Column<Record<string, unknown>>[] = [
    ...baseColumns,
    {
      key: "updatedAt",
      label: "Shipped On",
      render: (row) => (
        <span className="text-xs text-muted-foreground">
          {new Date(String(row.updatedAt)).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (row) => statusBadge(row.status as Order["status"]),
    },
  ];

  const cancelledColumns: Column<Record<string, unknown>>[] = [
    ...baseColumns,
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
      render: (row) => statusBadge(row.status as Order["status"]),
    },
  ];

  const columns =
    status === "PENDING"
      ? pendingColumns
      : status === "SHIPPED"
        ? shippedColumns
        : cancelledColumns;

  const emptyMessages: Record<Order["status"], string> = {
    PENDING: "No pending orders yet.",
    SHIPPED: "No shipped orders yet.",
    CANCELLED: "No cancelled orders.",
  };

  return (
    <DataTable
      columns={columns}
      data={(data?.data as unknown as Record<string, unknown>[]) ?? []}
      meta={data?.meta}
      onPageChange={setPage}
      isLoading={isLoading}
      emptyMessage={emptyMessages[status]}
    />
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function OrdersDashboard() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <Package className="h-6 w-6 text-brand" />
          Orders
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage orders received on your advertisements.
        </p>
      </div>

      {/* Three-tab layout */}
      <Tabs defaultValue="pending">
        <TabsList className="mb-4">
          <TabsTrigger value="pending" id="orders-tab-pending" className="gap-1.5">
            <Package className="h-3.5 w-3.5" />
            Pending Orders
          </TabsTrigger>
          <TabsTrigger value="shipped" id="orders-tab-shipped" className="gap-1.5">
            <Truck className="h-3.5 w-3.5" />
            Shipped Orders
          </TabsTrigger>
          <TabsTrigger value="cancelled" id="orders-tab-cancelled" className="gap-1.5">
            <XCircle className="h-3.5 w-3.5" />
            Cancelled Orders
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <OrdersTable status="PENDING" />
        </TabsContent>
        <TabsContent value="shipped">
          <OrdersTable status="SHIPPED" />
        </TabsContent>
        <TabsContent value="cancelled">
          <OrdersTable status="CANCELLED" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
