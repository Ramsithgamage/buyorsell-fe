import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  Package,
  CheckCircle2,
  PlusCircle,
  Building2,
  Eye,
  Pencil,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { StatsCard } from "@/components/dashboard/stats-card";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { UserProfile } from "@/hooks/use-profile";

interface MyStats {
  totalAds: number;
  activeAds: number;
}

interface Ad {
  id: number;
  title: string;
  price: number;
  isActive: boolean;
  createdAt: string;
}

interface PaginatedAds {
  data: Ad[];
  meta: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

interface VendorProfile {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  approvalStatus: string;
  vendorProfile?: {
    companyName: string;
    businessRegistrationNumber: string;
  };
}

interface VendorDashboardProps {
  user: UserProfile;
}

export function VendorDashboard({ user }: VendorDashboardProps) {
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const toggleStatusMutation = useMutation({
    mutationFn: ({ adId, isActive }: { adId: number; isActive: boolean }) =>
      api(`/advertisements/${adId}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive }),
      }),
    onSuccess: () => {
      toast.success("Product status updated successfully");
      queryClient.invalidateQueries({ queryKey: ["dashboard-my-ads"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-my-stats"] });
    },
    onError: (error: any) => toast.error(error.message || "Failed to update product status. Please try again."),
  });

  const productColumns: Column<Record<string, unknown>>[] = [
    {
      key: "title",
      label: "Product",
      render: (row) => (
        <span className="font-medium line-clamp-1 max-w-[260px]">
          {String(row.title)}
        </span>
      ),
    },
    {
      key: "price",
      label: "Price (LKR)",
      render: (row) => (
        <span className="tabular-nums">
          {Number(row.price).toLocaleString()}
        </span>
      ),
    },
    {
      key: "isActive",
      label: "Status",
      render: (row) =>
        row.isActive ? (
          <Button
            size="sm"
            variant="outline"
            className="h-7 gap-1.5 border-brand/20 bg-brand/10 text-brand hover:bg-brand/20"
            disabled={toggleStatusMutation.isPending}
            onClick={() => toggleStatusMutation.mutate({ adId: Number(row.id), isActive: false })}
          >
            <ToggleRight className="h-3.5 w-3.5" />
            Active
          </Button>
        ) : (
          <Button
            size="sm"
            variant="secondary"
            className="h-7 gap-1.5"
            disabled={toggleStatusMutation.isPending}
            onClick={() => toggleStatusMutation.mutate({ adId: Number(row.id), isActive: true })}
          >
            <ToggleLeft className="h-3.5 w-3.5" />
            Inactive
          </Button>
        ),
    },
    {
      key: "createdAt",
      label: "Listed",
      render: (row) => (
        <span className="text-muted-foreground text-xs">
          {new Date(String(row.createdAt)).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: "actions",
      label: "",
      render: (row) => (
        <div className="flex items-center gap-1">
          <Link to="/listing/$id" params={{ id: String(row.id) }}>
            <Button variant="ghost" size="icon" className="h-7 w-7" title="View">
              <Eye className="h-3.5 w-3.5" />
            </Button>
          </Link>
          <Button variant="ghost" size="icon" className="h-7 w-7" title="Edit" disabled>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  const { data: stats, isLoading: statsLoading } = useQuery<MyStats>({
    queryKey: ["dashboard-my-stats"],
    queryFn: () => api("/dashboard/my-stats"),
  });

  const { data: ads, isLoading: adsLoading } = useQuery<PaginatedAds>({
    queryKey: ["dashboard-my-ads", page],
    queryFn: () => api(`/dashboard/my-ads?page=${page}&limit=10`),
  });

  // Fetch full profile to get vendor profile fields
  const { data: fullProfile } = useQuery<VendorProfile>({
    queryKey: ["profile"],
    queryFn: () => api("/profile"),
  });

  const vendorInfo = (fullProfile as any)?.vendorProfile;

  return (
    <div className="p-6 space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Vendor Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage your products and store.
          </p>
        </div>
        <Link to="/post-ad">
          <Button className="bg-brand text-brand-foreground hover:opacity-90 gap-1.5">
            <PlusCircle className="h-4 w-4" />
            Add Product
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2">
        <StatsCard
          title="Total Products"
          value={statsLoading ? "—" : (stats?.totalAds ?? 0)}
          icon={Package}
          description="All products you have listed"
        />
        <StatsCard
          title="Active Products"
          value={statsLoading ? "—" : (stats?.activeAds ?? 0)}
          icon={CheckCircle2}
          description="Currently live on the marketplace"
        />
      </div>

      {/* Vendor profile card */}
      {vendorInfo && (
        <section className="space-y-3">
          <h2 className="text-base font-semibold">Store Profile</h2>
          <div className="rounded-xl border bg-card p-5 flex items-start gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand">
              <Building2 className="h-5 w-5" />
            </span>
            <div className="space-y-1">
              <p className="font-semibold text-sm">{vendorInfo.companyName}</p>
              <p className="text-xs text-muted-foreground">
                Registration No.:{" "}
                <span className="font-mono">{vendorInfo.businessRegistrationNumber}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                Contact: {user.email}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Products table */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold">My Products</h2>
        <DataTable
          columns={productColumns}
          data={(ads?.data as Record<string, unknown>[]) ?? []}
          meta={ads?.meta}
          onPageChange={setPage}
          isLoading={adsLoading}
          emptyMessage="You haven't listed any products yet."
        />
      </section>
    </div>
  );
}
