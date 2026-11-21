import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { SiteHeader } from "@/components/site-header";
import { useAuth } from "@/hooks/use-auth";

// Phase 2 stub so the header link resolves; the full profile page is built in Phase 4.
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
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
        <p className="mt-2 text-muted-foreground">
          {user ? `${user.firstName} ${user.lastName} · ${user.email}` : "Loading…"}
        </p>
      </main>
    </div>
  );
}
