import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Heart, Package, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AdDetailsModal } from "@/components/ad-details-modal";
import { WishlistButton } from "@/components/wishlist-button";
import { useClearWishlist, useWishlist } from "@/hooks/use-wishlist";

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
  const [page, setPage] = useState(1);
  const [selectedAdId, setSelectedAdId] = useState<number | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const { data, isLoading, isError } = useWishlist(page);
  const clear = useClearWishlist();

  const items = data?.data ?? [];
  const meta = data?.meta;

  // If the last item on a page is removed, step back a page.
  useEffect(() => {
    if (meta && items.length === 0 && page > 1) setPage(page - 1);
  }, [meta, items.length, page]);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Your wishlist</h1>
            {meta && <p className="text-sm text-muted-foreground">{meta.totalItems} saved item(s)</p>}
          </div>
          {meta && meta.totalItems > 0 && (
            <Button variant="outline" onClick={() => setConfirmClear(true)}>
              <Trash2 className="mr-2 h-4 w-4" /> Clear all
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-64 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : isError ? (
          <p className="py-20 text-center text-destructive">Failed to load your wishlist.</p>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-full bg-muted">
              <Heart className="h-7 w-7 text-muted-foreground" />
            </span>
            <p className="mt-4 text-muted-foreground">Nothing saved yet. Tap the heart on a listing to save it.</p>
            <Link to="/browse" search={{ q: "", category: "", sub: "" }} className="mt-6">
              <Button variant="outline">Continue browsing</Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {items.map(({ id, advertisement: ad }) => (
                <article
                  key={id}
                  onClick={() => setSelectedAdId(ad.id)}
                  className={`group cursor-pointer overflow-hidden rounded-lg border bg-card transition hover:shadow-lg ${
                    ad.isActive ? "" : "opacity-70"
                  }`}
                >
                  <div className="relative grid aspect-square place-items-center overflow-hidden bg-muted">
                    <WishlistButton adId={ad.id} ownerId={ad.userId} className="absolute right-1.5 top-1.5 z-10 h-7 w-7 [&_svg]:h-4 [&_svg]:w-4" />
                    {!ad.isActive && (
                      <Badge variant="secondary" className="absolute left-1.5 top-1.5 z-10 text-[10px]">
                        Unavailable
                      </Badge>
                    )}
                    {ad.images?.length ? (
                      <img src={ad.images[0]} alt={ad.title} className="h-full w-full object-cover transition group-hover:scale-105" />
                    ) : (
                      <Package className="h-10 w-10 text-brand/60" />
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="line-clamp-2 min-h-10 text-sm">{ad.title}</h3>
                    <p className="mt-1 text-sm font-semibold text-brand">LKR {Number(ad.price).toLocaleString()}</p>
                  </div>
                </article>
              ))}
            </div>

            {meta && meta.totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-4">
                <Button variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {meta.currentPage} of {meta.totalPages}
                </span>
                <Button variant="outline" disabled={page >= meta.totalPages} onClick={() => setPage(page + 1)}>
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </main>

      <AdDetailsModal id={selectedAdId} onClose={() => setSelectedAdId(null)} />

      <AlertDialog open={confirmClear} onOpenChange={setConfirmClear}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear your wishlist?</AlertDialogTitle>
            <AlertDialogDescription>This removes all saved items. This can't be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                clear.mutate(undefined, {
                  onSuccess: () => {
                    setPage(1);
                    toast.success("Wishlist cleared");
                  },
                  onError: (e: Error) => toast.error(e.message || "Failed to clear wishlist"),
                })
              }
            >
              Clear all
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
