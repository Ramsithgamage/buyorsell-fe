import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { UserDashboard } from "@/components/dashboard/user-dashboard";
import { VendorDashboard } from "@/components/dashboard/vendor-dashboard";
import { AdminDashboard } from "@/components/dashboard/admin-dashboard";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: () => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("access_token");
      if (!token) throw new Error("Unauthenticated");
    }
  },
  head: () => ({
    meta: [
      { title: "Dashboard — Verdant" },
      { name: "description", content: "Manage your Verdant account, listings, and settings." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DashboardPage,
  errorComponent: () => {
    const navigate = Route.useNavigate();
    useEffect(() => {
      navigate({ to: "/auth" });
    }, [navigate]);
    return null;
  },
});

function LoadingShell() {
  return (
    <div className="p-6 space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}

function DashboardPage() {
  const navigate = useNavigate();
  const { user, isLoading, isAuthenticated, isAdmin, isVendor } = useAuth();

  useEffect(() => {
    // Only redirect if we are not loading AND there is no authenticated user
    // AND there is no token in localStorage (token present means the profile
    // query is still in-flight — avoid the /auth <-> /dashboard redirect loop).
    const hasToken = !!localStorage.getItem("access_token");
    if (!isLoading && !isAuthenticated && !hasToken) {
      navigate({ to: "/auth" });
    }
  }, [isLoading, isAuthenticated, navigate]);

  const renderContent = () => {
    if (isLoading || !user) return <LoadingShell />;
    if (isAdmin) return <AdminDashboard user={user} />;
    if (isVendor) return <VendorDashboard user={user} />;
    return <UserDashboard user={user} />;
  };

  return (
    <SidebarProvider>
      <DashboardSidebar user={user} />
      <SidebarInset>
        <div className="min-h-screen bg-background">
          {renderContent()}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
