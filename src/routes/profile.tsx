import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { SiteHeader } from "@/components/site-header";
import { ProfileHeader } from "@/components/profile/profile-header";
import { ProfileForm } from "@/components/profile/profile-form";
import { VendorDetailsCard } from "@/components/profile/vendor-details-card";
import { ChangePasswordCard } from "@/components/profile/change-password-card";
import { DangerZoneCard } from "@/components/profile/danger-zone-card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/profile")({
  beforeLoad: () => {
    if (typeof window !== "undefined" && !localStorage.getItem("access_token")) {
      throw new Error("Unauthenticated");
    }
  },
  head: () => ({
    meta: [
      { title: "Profile — Buy Or Sell" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ProfilePage,
  errorComponent: () => {
    const navigate = Route.useNavigate();
    useEffect(() => {
      navigate({ to: "/auth" });
    }, [navigate]);
    return null;
  },
});

function ProfilePage() {
  const { user, isLoading } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
        {isLoading || !user ? (
          <>
            <Skeleton className="h-40 rounded-xl" />
            <Skeleton className="h-64 rounded-xl" />
          </>
        ) : (
          <>
            <ProfileHeader user={user} />
            <ProfileForm user={user} />
            {user.role === "VENDOR" && user.vendorProfile && (
              <VendorDetailsCard vendor={user.vendorProfile} />
            )}
            <ChangePasswordCard />
            <DangerZoneCard />
          </>
        )}
      </main>
    </div>
  );
}
