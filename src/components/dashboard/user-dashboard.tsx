import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  ListOrdered,
  CheckCircle2,
  PlusCircle,
  ShoppingBag,
  Eye,
  Pencil,
  Clock,
} from "lucide-react";
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
  slug: string;
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

interface UserDashboardProps {
  user: UserProfile;
}

const adColumns: Column<Record<string, unknown>>[] = [
  {
    key: "title",
    label: "Title",
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
        <Badge className="bg-brand/10 text-brand border-brand/20 hover:bg-brand/20">
          Active
        </Badge>
      ) : (
        <Badge variant="secondary">Inactive</Badge>
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

export function UserDashboard({ user }: UserDashboardProps) {
  const [page, setPage] = useState(1);

  const { data: stats, isLoading: statsLoading } = useQuery<MyStats>({
    queryKey: ["dashboard-my-stats"],
    queryFn: () => api("/dashboard/my-stats"),
  });

  const { data: ads, isLoading: adsLoading } = useQuery<PaginatedAds>({
    queryKey: ["dashboard-my-ads", page],
    queryFn: () => api(`/dashboard/my-ads?page=${page}&limit=10`),
  });

  return (
    <div className="p-6 space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Welcome back, {user.firstName}!
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Here's what's happening with your account.
          </p>
        </div>
        <Link to="/post-ad">
          <Button className="bg-brand text-brand-foreground hover:opacity-90 gap-1.5">
            <PlusCircle className="h-4 w-4" />
            Post New Ad
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2">
        <StatsCard
          title="Total Listings"
          value={statsLoading ? "—" : (stats?.totalAds ?? 0)}
          icon={ListOrdered}
          description="All ads you have posted"
        />
        <StatsCard
          title="Active Listings"
          value={statsLoading ? "—" : (stats?.activeAds ?? 0)}
          icon={CheckCircle2}
          description="Currently live on the marketplace"
        />
      </div>

      {/* My Listings */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold">My Listings</h2>
        <DataTable
          columns={adColumns}
          data={(ads?.data as Record<string, unknown>[]) ?? []}
          meta={ads?.meta}
          onPageChange={setPage}
          isLoading={adsLoading}
          emptyMessage="You haven't posted any listings yet."
        />
      </section>

      {/* Purchase History — Coming Soon */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold">Purchase History</h2>
        <div className="rounded-xl border border-dashed bg-muted/30 p-10 flex flex-col items-center gap-3 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-muted text-muted-foreground">
            <ShoppingBag className="h-5 w-5" />
          </span>
          <div>
            <p className="font-medium text-sm">Purchase history coming soon</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Once our order system launches, your purchases will appear here.
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground border rounded-full px-3 py-1 bg-background">
            <Clock className="h-3 w-3" /> In development
          </div>
        </div>
      </section>
    </div>
  );
}
