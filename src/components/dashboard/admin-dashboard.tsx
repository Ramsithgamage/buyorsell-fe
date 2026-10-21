import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Users,
  Store,
  ClipboardCheck,
  Megaphone,
  CheckCircle2,
  Check,
  X,
  ToggleLeft,
  ToggleRight,
  Sparkles,
  Plus,
  Pencil,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { api } from "@/lib/api";
import { StatsCard } from "@/components/dashboard/stats-card";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PromoAdModal, type PromoAd } from "@/components/dashboard/promo-ad-modal";
import type { UserProfile } from "@/hooks/use-profile";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AdminStats {
  totalUsers: number;
  totalVendors: number;
  pendingApprovals: number;
  totalAds: number;
  activeAds: number;
}

interface UserRow {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  approvalStatus: string;
  createdAt: string;
}

interface PaginatedUsers {
  data: UserRow[];
  meta: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: string }) {
  const styles: Record<string, string> = {
    ADMIN: "bg-purple-100 text-purple-700 border-purple-200",
    VENDOR: "bg-blue-100 text-blue-700 border-blue-200",
    USER: "bg-brand/10 text-brand border-brand/20",
  };
  return <Badge className={`${styles[role] ?? ""} hover:opacity-80`}>{role}</Badge>;
}

function ApprovalBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    APPROVED: "bg-emerald-100 text-emerald-700 border-emerald-200",
    PENDING: "bg-amber-100 text-amber-700 border-amber-200",
    REJECTED: "bg-red-100 text-red-700 border-red-200",
  };
  return <Badge className={`${styles[status] ?? ""} hover:opacity-80`}>{status}</Badge>;
}

function PromoStatusBadge({ promo }: { promo: PromoAd }) {
  const now = new Date();
  const start = new Date(promo.startDate);
  const end = new Date(promo.endDate);

  if (!promo.isActive) {
    return (
      <Badge variant="secondary" className="bg-gray-100 text-gray-700 border-gray-200">
        Disabled
      </Badge>
    );
  }
  if (now < start) {
    return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Scheduled</Badge>;
  }
  if (now > end) {
    return (
      <Badge variant="destructive" className="bg-red-100 text-red-700 border-red-200">
        Expired
      </Badge>
    );
  }
  return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Active</Badge>;
}

// ─── Main component ───────────────────────────────────────────────────────────

interface AdminDashboardProps {
  user: UserProfile;
}

export function AdminDashboard({ user }: AdminDashboardProps) {
  const [usersPage, setUsersPage] = useState(1);
  const [activeAdsPage, setActiveAdsPage] = useState(1);
  const [inactiveAdsPage, setInactiveAdsPage] = useState(1);
  const queryClient = useQueryClient();

  // ── Queries ──
  const { data: stats, isLoading: statsLoading } = useQuery<AdminStats>({
    queryKey: ["dashboard-admin-stats"],
    queryFn: () => api("/dashboard/admin/stats"),
  });

  const { data: users, isLoading: usersLoading } = useQuery<PaginatedUsers>({
    queryKey: ["dashboard-admin-users", usersPage],
    queryFn: () => api(`/dashboard/admin/users?page=${usersPage}&limit=15`),
  });

  const { data: pending, isLoading: pendingLoading } = useQuery<UserRow[]>({
    queryKey: ["dashboard-admin-pending"],
    queryFn: () => api("/dashboard/admin/pending"),
  });

  const { data: activeAds, isLoading: activeAdsLoading } = useQuery<PaginatedAds>({
    queryKey: ["dashboard-admin-ads", "active", activeAdsPage],
    queryFn: () =>
      api(`/dashboard/admin/advertisements?isActive=true&page=${activeAdsPage}&limit=15`),
  });

  const { data: inactiveAds, isLoading: inactiveAdsLoading } = useQuery<PaginatedAds>({
    queryKey: ["dashboard-admin-ads", "inactive", inactiveAdsPage],
    queryFn: () =>
      api(`/dashboard/admin/advertisements?isActive=false&page=${inactiveAdsPage}&limit=15`),
  });

  // ── Promotional Ads Queries & Mutations ──
  const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);
  const [promoToEdit, setPromoToEdit] = useState<PromoAd | null>(null);

  const { data: promoAds, isLoading: promoAdsLoading } = useQuery<PromoAd[]>({
    queryKey: ["dashboard-admin-promos"],
    queryFn: async () => {
      const data = await api("/promotional-ads");
      return (data ?? []) as PromoAd[];
    },
  });

  const togglePromoStatusMutation = useMutation({
    mutationFn: ({ promoId, isActive }: { promoId: number; isActive: boolean }) =>
      api(`/promotional-ads/${promoId}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive }),
      }),
    onSuccess: () => {
      toast.success("Promotional advertisement status updated successfully");
      queryClient.invalidateQueries({ queryKey: ["dashboard-admin-promos"] });
      queryClient.invalidateQueries({ queryKey: ["promotional-ads-active"] });
    },
    onError: (error: any) =>
      toast.error(error.message || "Failed to update promotional advertisement status."),
  });

  const deletePromoMutation = useMutation({
    mutationFn: (promoId: number) =>
      api(`/promotional-ads/${promoId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      toast.success("Promotional advertisement deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["dashboard-admin-promos"] });
      queryClient.invalidateQueries({ queryKey: ["promotional-ads-active"] });
    },
    onError: (error: any) =>
      toast.error(error.message || "Failed to delete promotional advertisement."),
  });

  // ── Approve / Reject mutation ──
  const approveMutation = useMutation({
    mutationFn: ({ userId, status }: { userId: number; status: "APPROVED" | "REJECTED" }) =>
      api(`/users/${userId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
    onSuccess: (_, { status }) => {
      toast.success(`User ${status.toLowerCase()} successfully`);
      queryClient.invalidateQueries({ queryKey: ["dashboard-admin-pending"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-admin-stats"] });
    },
    onError: () => toast.error("Action failed. Please try again."),
  });

  // ── Toggle Ad Status mutation ──
  const toggleStatusMutation = useMutation({
    mutationFn: ({ adId, isActive }: { adId: number; isActive: boolean }) =>
      api(`/advertisements/${adId}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive }),
      }),
    onSuccess: () => {
      toast.success("Advertisement status updated successfully");
      queryClient.invalidateQueries({ queryKey: ["dashboard-admin-ads"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-admin-stats"] });
    },
    onError: (error: any) =>
      toast.error(error.message || "Failed to update advertisement status. Please try again."),
  });

  // ── Column definitions ──
  const userColumns: Column<Record<string, unknown>>[] = [
    {
      key: "name",
      label: "Name",
      render: (row) => (
        <span className="font-medium">
          {String(row.firstName)} {String(row.lastName)}
        </span>
      ),
    },
    { key: "email", label: "Email" },
    {
      key: "role",
      label: "Role",
      render: (row) => <RoleBadge role={String(row.role)} />,
    },
    {
      key: "approvalStatus",
      label: "Status",
      render: (row) => <ApprovalBadge status={String(row.approvalStatus)} />,
    },
    {
      key: "createdAt",
      label: "Joined",
      render: (row) => (
        <span className="text-muted-foreground text-xs">
          {new Date(String(row.createdAt)).toLocaleDateString()}
        </span>
      ),
    },
  ];

  const pendingColumns: Column<Record<string, unknown>>[] = [
    {
      key: "name",
      label: "Name",
      render: (row) => (
        <span className="font-medium">
          {String(row.firstName)} {String(row.lastName)}
        </span>
      ),
    },
    { key: "email", label: "Email" },
    {
      key: "role",
      label: "Role",
      render: (row) => <RoleBadge role={String(row.role)} />,
    },
    {
      key: "createdAt",
      label: "Registered",
      render: (row) => (
        <span className="text-muted-foreground text-xs">
          {new Date(String(row.createdAt)).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            className="h-7 gap-1 bg-brand text-brand-foreground hover:opacity-90"
            disabled={approveMutation.isPending}
            onClick={() => approveMutation.mutate({ userId: Number(row.id), status: "APPROVED" })}
          >
            <Check className="h-3.5 w-3.5" /> Approve
          </Button>
          <Button
            size="sm"
            variant="destructive"
            className="h-7 gap-1"
            disabled={approveMutation.isPending}
            onClick={() => approveMutation.mutate({ userId: Number(row.id), status: "REJECTED" })}
          >
            <X className="h-3.5 w-3.5" /> Reject
          </Button>
        </div>
      ),
    },
  ];

  const adsColumns: Column<Record<string, unknown>>[] = [
    {
      key: "title",
      label: "Title",
      render: (row) => (
        <span className="font-medium line-clamp-1 max-w-[280px]">{String(row.title)}</span>
      ),
    },
    {
      key: "price",
      label: "Price (LKR)",
      render: (row) => <span className="tabular-nums">{Number(row.price).toLocaleString()}</span>,
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
      label: "Posted",
      render: (row) => (
        <span className="text-muted-foreground text-xs">
          {new Date(String(row.createdAt)).toLocaleDateString()}
        </span>
      ),
    },
  ];

  const promoColumns: Column<Record<string, unknown>>[] = [
    {
      key: "image",
      label: "Banner",
      render: (row) => (
        <div className="h-10 w-20 overflow-hidden rounded border bg-muted shrink-0">
          <img src={String(row.image)} alt="Promo banner" className="h-full w-full object-cover" />
        </div>
      ),
    },
    {
      key: "linkUrl",
      label: "Destination URL",
      render: (row) => (
        <a
          href={String(row.linkUrl)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-brand hover:underline max-w-[220px]"
        >
          <span className="truncate">{String(row.linkUrl)}</span>
          <ExternalLink className="h-3 w-3 shrink-0" />
        </a>
      ),
    },
    {
      key: "schedule",
      label: "Campaign Duration",
      render: (row) => {
        try {
          const start = format(parseISO(String(row.startDate)), "MMM d, yyyy");
          const end = format(parseISO(String(row.endDate)), "MMM d, yyyy");
          return (
            <div className="text-xs">
              <span className="font-medium">{start}</span>
              <span className="text-muted-foreground mx-1">→</span>
              <span className="font-medium">{end}</span>
            </div>
          );
        } catch {
          return <span className="text-xs text-muted-foreground">—</span>;
        }
      },
    },
    {
      key: "status",
      label: "Status",
      render: (row) => <PromoStatusBadge promo={row as unknown as PromoAd} />,
    },
    {
      key: "actions",
      label: "Actions",
      render: (row) => {
        const promo = row as unknown as PromoAd;
        return (
          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              variant="outline"
              className="h-7 w-7 p-0"
              title="Edit promotion"
              onClick={() => {
                setPromoToEdit(promo);
                setIsPromoModalOpen(true);
              }}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="sm"
              variant={promo.isActive ? "outline" : "secondary"}
              className="h-7 gap-1 px-2 text-xs"
              title={promo.isActive ? "Deactivate" : "Activate"}
              disabled={togglePromoStatusMutation.isPending}
              onClick={() =>
                togglePromoStatusMutation.mutate({
                  promoId: Number(promo.id),
                  isActive: !promo.isActive,
                })
              }
            >
              {promo.isActive ? (
                <>
                  <ToggleRight className="h-3.5 w-3.5 text-brand" />
                  <span className="hidden sm:inline">Active</span>
                </>
              ) : (
                <>
                  <ToggleLeft className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="hidden sm:inline">Inactive</span>
                </>
              )}
            </Button>
            <Button
              size="sm"
              variant="destructive"
              className="h-7 w-7 p-0"
              title="Delete promotion"
              disabled={deletePromoMutation.isPending}
              onClick={() => {
                if (
                  window.confirm("Are you sure you want to delete this promotional advertisement?")
                ) {
                  deletePromoMutation.mutate(Number(promo.id));
                }
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Platform overview and management — logged in as{" "}
          <span className="font-medium">{user.email}</span>.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        <StatsCard
          title="Total Users"
          value={statsLoading ? "—" : (stats?.totalUsers ?? 0)}
          icon={Users}
          description="Registered accounts"
        />
        <StatsCard
          title="Total Vendors"
          value={statsLoading ? "—" : (stats?.totalVendors ?? 0)}
          icon={Store}
          description="Vendor accounts"
        />
        <StatsCard
          title="Pending Approvals"
          value={statsLoading ? "—" : (stats?.pendingApprovals ?? 0)}
          icon={ClipboardCheck}
          description="Awaiting review"
          className={(stats?.pendingApprovals ?? 0) > 0 ? "border-amber-200 bg-amber-50/50" : ""}
        />
        <StatsCard
          title="Total Ads"
          value={statsLoading ? "—" : (stats?.totalAds ?? 0)}
          icon={Megaphone}
          description="All listings"
        />
        <StatsCard
          title="Active Ads"
          value={statsLoading ? "—" : (stats?.activeAds ?? 0)}
          icon={CheckCircle2}
          description="Live on marketplace"
        />
        <StatsCard
          title="Active Promos"
          value={
            promoAdsLoading
              ? "—"
              : (promoAds?.filter(
                  (p) =>
                    p.isActive &&
                    new Date() >= new Date(p.startDate) &&
                    new Date() <= new Date(p.endDate),
                ).length ?? 0)
          }
          icon={Sparkles}
          description="Live on homepage"
        />
      </div>

      {/* Tabbed management area */}
      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">
            Users
            {users?.meta.totalItems !== undefined && (
              <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                {users.meta.totalItems}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pending Approvals
            {(stats?.pendingApprovals ?? 0) > 0 && (
              <span className="ml-1.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                {stats?.pendingApprovals}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="active-ads">Active Ads</TabsTrigger>
          <TabsTrigger value="inactive-ads">Inactive Ads</TabsTrigger>
          <TabsTrigger value="promotional-ads" className="gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            Promo Ads
            {promoAds?.length !== undefined && (
              <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                {promoAds.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ── Users tab ── */}
        <TabsContent value="users" className="mt-4">
          <DataTable
            columns={userColumns}
            data={(users?.data as unknown as Record<string, unknown>[]) ?? []}
            meta={users?.meta}
            onPageChange={setUsersPage}
            isLoading={usersLoading}
            emptyMessage="No users found."
          />
        </TabsContent>

        {/* ── Pending tab ── */}
        <TabsContent value="pending" className="mt-4">
          {!pendingLoading && (pending?.length ?? 0) === 0 ? (
            <div className="rounded-xl border border-dashed bg-muted/30 p-10 flex flex-col items-center gap-3 text-center">
              <span className="grid h-12 w-12 place-items-center rounded-full bg-muted text-muted-foreground">
                <ClipboardCheck className="h-5 w-5" />
              </span>
              <div>
                <p className="font-medium text-sm">All caught up!</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  No accounts are pending approval right now.
                </p>
              </div>
            </div>
          ) : (
            <DataTable
              columns={pendingColumns}
              data={(pending as unknown as Record<string, unknown>[]) ?? []}
              isLoading={pendingLoading}
              emptyMessage="No pending approvals."
            />
          )}
        </TabsContent>

        {/* ── Active Ads tab ── */}
        <TabsContent value="active-ads" className="mt-4">
          <DataTable
            columns={adsColumns}
            data={(activeAds?.data as unknown as Record<string, unknown>[]) ?? []}
            meta={activeAds?.meta}
            onPageChange={setActiveAdsPage}
            isLoading={activeAdsLoading}
            emptyMessage="No active advertisements found."
          />
        </TabsContent>

        {/* ── Inactive Ads tab ── */}
        <TabsContent value="inactive-ads" className="mt-4">
          <DataTable
            columns={adsColumns}
            data={(inactiveAds?.data as unknown as Record<string, unknown>[]) ?? []}
            meta={inactiveAds?.meta}
            onPageChange={setInactiveAdsPage}
            isLoading={inactiveAdsLoading}
            emptyMessage="No inactive advertisements found."
          />
        </TabsContent>

        {/* ── Promotional Ads tab ── */}
        <TabsContent value="promotional-ads" className="mt-4 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border bg-card p-4">
            <div>
              <h3 className="text-base font-semibold">Promotional Advertisements</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Manage home page carousel banner campaigns with custom date durations.
              </p>
            </div>
            <Button
              size="sm"
              className="gap-1.5 bg-brand text-brand-foreground hover:bg-brand/90 shrink-0"
              onClick={() => {
                setPromoToEdit(null);
                setIsPromoModalOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Create Promotion
            </Button>
          </div>

          <DataTable
            columns={promoColumns}
            data={(promoAds as unknown as Record<string, unknown>[]) ?? []}
            isLoading={promoAdsLoading}
            emptyMessage="No promotional advertisements found. Click 'Create Promotion' to add one."
          />
        </TabsContent>
      </Tabs>

      <PromoAdModal
        open={isPromoModalOpen}
        onOpenChange={setIsPromoModalOpen}
        promoToEdit={promoToEdit}
      />
    </div>
  );
}
