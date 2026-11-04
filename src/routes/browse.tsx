import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Search, MapPin, Package, Plus, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { api } from "@/lib/api";
import { SiteHeader } from "@/components/site-header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AdDetailsModal } from "@/components/ad-details-modal";

const searchSchema = z.object({
  q: z.string().catch(""),
  category: z.string().catch(""),
  sub: z.string().catch(""),
});

export const Route = createFileRoute("/browse")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Browse listings — Verdant" },
      { name: "description", content: "Search and filter thousands of items for sale across every category on Verdant." },
      { property: "og:title", content: "Browse listings — Verdant" },
      { property: "og:description", content: "Search and filter items for sale across every category on Verdant." },
    ],
  }),
  component: Browse,
});

type Cat = { id: number; name: string; slug: string; parentId: number | null; children?: Sub[] };
type Sub = { id: number; name: string; slug: string; parentId: number | null };
type Listing = {
  id: number; title: string; description: string; price: number;
  userId: number; categoryId: number; images: string[]; updatedAt: string;
  user?: { firstName: string; lastName: string };
};

function Browse() {
  const { q, category, sub } = Route.useSearch();
  const navigate = Route.useNavigate();
  const [term, setTerm] = useState(q);
  const [selectedAdId, setSelectedAdId] = useState<number | null>(null);

  // Keep the input in sync when the URL query changes (header links, back/forward, etc.)
  useEffect(() => {
    setTerm(q);
  }, [q]);

  const { data: categories, isLoading: catsLoading } = useQuery({
    queryKey: ["cats"],
    queryFn: async () => {
      const data = await api("/categories");
      return (data ?? []) as Cat[];
    },
  });

  const activeCat = categories?.find((c) => c.slug === category);
  const subs = activeCat?.children ?? [];
  const activeSub = subs.find((s) => s.slug === sub);
  const catId = activeSub ? activeSub.id : activeCat ? activeCat.id : undefined;
  const searchTerm = q.trim();

  // Wait for categories when a category filter is in the URL, otherwise the
  // first request would be sent without the category and show unfiltered results.
  const waitingForCategory = !!category && catsLoading;

  const { data: result, isLoading: listingsLoading } = useQuery({
    queryKey: ["listings", searchTerm, catId ?? null],
    enabled: !waitingForCategory,
    queryFn: async () => {
      const params = new URLSearchParams({ limit: "50", page: "1" });
      if (searchTerm) params.append("q", searchTerm);
      if (catId) params.append("categoryId", catId.toString());

      const data = await api(`/advertisements?${params.toString()}`);
      return {
        items: (data?.data ?? []) as Listing[],
        total: (data?.meta?.totalItems ?? data?.data?.length ?? 0) as number,
      };
    },
  });
  const listings = result?.items;
  const isLoading = waitingForCategory || listingsLoading;

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({ search: (p: z.infer<typeof searchSchema>) => ({ ...p, q: term.trim() }) });
  };

  const clearSearch = () => {
    setTerm("");
    navigate({ search: (p: z.infer<typeof searchSchema>) => ({ ...p, q: "" }) });
  };

  const getCategoryName = (categoryId: number) => {
    for (const cat of categories ?? []) {
      if (cat.id === categoryId) return cat.name;
      const subCat = cat.children?.find((s: Sub) => s.id === categoryId);
      if (subCat) return subCat.name;
    }
    return "Unknown Category";
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <div className="border-b bg-secondary/30">
        <div className="mx-auto max-w-7xl px-4 py-6">
          <form onSubmit={submitSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="Search items…"
                className="pl-9 pr-9 h-11"
                maxLength={100}
              />
              {term && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <Button type="submit" className="h-11 bg-brand text-brand-foreground hover:opacity-90">Search</Button>
          </form>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 grid gap-8 lg:grid-cols-[240px_1fr]">
        {/* Sidebar */}
        <aside className="space-y-6">
          <div>
            <h3 className="text-sm font-semibold mb-3 uppercase tracking-wider text-muted-foreground">Categories</h3>
            <ul className="space-y-1">
              <li>
                <Link to="/browse" search={{ q, category: "", sub: "" }}
                  className={`block rounded-md px-3 py-2 text-sm ${!category ? "bg-brand text-brand-foreground" : "hover:bg-accent"}`}>
                  All categories
                </Link>
              </li>
              {(categories ?? []).map((c) => (
                <li key={c.id}>
                  <Link to="/browse" search={{ q, category: c.slug, sub: "" }}
                    className={`block rounded-md px-3 py-2 text-sm ${category === c.slug ? "bg-brand text-brand-foreground" : "hover:bg-accent"}`}>
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {subs && subs.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-3 uppercase tracking-wider text-muted-foreground">Subcategories</h3>
              <ul className="space-y-1">
                <li>
                  <Link to="/browse" search={{ q, category, sub: "" }}
                    className={`block rounded-md px-3 py-2 text-sm ${!sub ? "bg-accent" : "hover:bg-accent"}`}>
                    All in {activeCat?.name}
                  </Link>
                </li>
                {subs.map((s) => (
                  <li key={s.id}>
                    <Link to="/browse" search={{ q, category, sub: s.slug }}
                      className={`block rounded-md px-3 py-2 text-sm ${sub === s.slug ? "bg-brand text-brand-foreground" : "hover:bg-accent"}`}>
                      {s.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>

        {/* Grid */}
        <main>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h1 className="text-2xl font-semibold">
                {activeCat ? (activeSub ? `${activeCat.name} › ${activeSub.name}` : activeCat.name) : "All listings"}
                {searchTerm && <span className="text-muted-foreground font-normal"> · "{searchTerm}"</span>}
              </h1>
              <p className="text-sm text-muted-foreground">{isLoading ? "Searching…" : `${result?.total ?? 0} results`}</p>
            </div>
            <Link to="/post-ad">
              <Button size="icon" className="h-10 w-10 rounded-full bg-brand text-brand-foreground hover:opacity-90 shadow-sm transition-transform hover:scale-105">
                <Plus className="h-5 w-5" />
                <span className="sr-only">Post Ad</span>
              </Button>
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-64 rounded-xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : listings && listings.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {listings.map((l) => (
                <article 
                  key={l.id} 
                  className="group rounded-xl border bg-card overflow-hidden hover:shadow-lg hover:border-brand transition cursor-pointer"
                  onClick={() => setSelectedAdId(l.id)}
                >
                  <div className="aspect-[4/3] bg-accent grid place-items-center overflow-hidden">
                    {l.images && l.images.length > 0 ? (
                      <img src={l.images[0]} alt={l.title} className="h-full w-full object-cover group-hover:scale-105 transition" />
                    ) : (
                      <Package className="h-10 w-10 text-brand/60" />
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold line-clamp-1">{l.title}</h3>
                    </div>
                    {l.description && <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{l.description}</p>}
                    
                    <div className="mt-2 text-xs text-muted-foreground">
                      <span className="block">Category: {getCategoryName(l.categoryId)}</span>
                      <span className="block">Seller: {l.user ? `${l.user.firstName} ${l.user.lastName}` : `User ${l.userId}`}</span>
                      <span className="block">Updated: {new Date(l.updatedAt).toLocaleDateString()}</span>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-lg font-semibold text-brand">
                        LKR {Number(l.price).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : searchTerm ? (
            <div className="rounded-xl border border-dashed p-16 text-center">
              <Search className="mx-auto h-10 w-10 text-muted-foreground" />
              <h3 className="mt-3 font-semibold">No results for "{searchTerm}"</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Try different keywords{activeCat ? " or search in all categories" : ""}.
              </p>
              <div className="mt-4 flex justify-center gap-2">
                <Button variant="outline" onClick={clearSearch}>Clear search</Button>
                {activeCat && (
                  <Link to="/browse" search={{ q: searchTerm, category: "", sub: "" }}>
                    <Button className="bg-brand text-brand-foreground hover:opacity-90">Search all categories</Button>
                  </Link>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed p-16 text-center">
              <Package className="mx-auto h-10 w-10 text-muted-foreground" />
              <h3 className="mt-3 font-semibold">No listings yet</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Be the first to list something in this category.
              </p>
              <Link to="/auth" className="inline-block mt-4">
                <Button className="bg-brand text-brand-foreground hover:opacity-90">Start selling</Button>
              </Link>
            </div>
          )}
        </main>
      </div>

      <AdDetailsModal id={selectedAdId} onClose={() => setSelectedAdId(null)} />
    </div>
  );
}
