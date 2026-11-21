import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { Heart } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/wishlist")({
  beforeLoad: () => {
    if (typeof window !== "undefined" && !localStorage.getItem("access_token")) {
      throw new Error("Unauthenticated");
    }
  },
  head: () => ({
    meta: [
      { title: "Wishlist — Buy Or Sell" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: WishlistPage,
  errorComponent: () => {
    const navigate = Route.useNavigate();
    useEffect(() => {
      navigate({ to: "/auth" });
    }, [navigate]);
    return null;
  },
});

function WishlistPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto flex max-w-3xl flex-col items-center px-4 py-24 text-center">
        <span className="grid h-14 w-14 place-items-center rounded-full bg-muted">
          <Heart className="h-7 w-7 text-muted-foreground" />
        </span>
        <h1 className="mt-6 text-2xl font-semibold tracking-tight">Your wishlist</h1>
        <p className="mt-2 text-muted-foreground">Wishlist is coming soon. Check back later!</p>
        <Link to="/browse" search={{ q: "", category: "", sub: "" }} className="mt-6">
          <Button variant="outline">Continue browsing</Button>
        </Link>
      </main>
    </div>
  );
}
