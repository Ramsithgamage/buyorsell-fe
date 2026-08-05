import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";
import { Search, MapPin, Package } from "lucide-react";
import { apiClient } from "@/lib/api";
import { SiteHeader } from "@/components/site-header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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

type CategoryTree = {
  id: number;
  name: string;
  slug: string;
  isActive: boolean;
  parentId: number | null;
  children: CategoryTree[];
};

type Listing = {
  id: number;
  title: string;
  slug: string;
  description: string;
  price: number;
  userId: number;
  user?: {
    firstName: string;
    lastName: string;
  };
  categoryId: number;
  images: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

const findCategoryBySlug = (tree: CategoryTree[], slug: string): CategoryTree | undefined => {
  if (!tree) return undefined;
  for (const node of tree) {
    if (node.slug === slug) return node;
    const found = findCategoryBySlug(node.children, slug);
    if (found) return found;
  }
  return undefined;
};

const findCategoryById = (tree: CategoryTree[], id: number): CategoryTree | undefined => {
  if (!tree) return undefined;
  for (const node of tree) {
    if (node.id === id) return node;
    const found = findCategoryById(node.children, id);
    if (found) return found;
  }
  return undefined;
};

function Browse() {
  const { q, category, sub } = Route.useSearch();
  const navigate = Route.useNavigate();
  const [term, setTerm] = useState(q);

  const { data: categoryTree } = useQuery({
    queryKey: ["cats"],
    queryFn: async () => {
      const { data } = await apiClient.get<CategoryTree[]>("/categories");
      return data || [];
    },
  });

  const allCategories = categoryTree || [];
  const activeCat = category ? findCategoryBySlug(allCategories, category) : undefined;
  const subs = activeCat?.children || [];
  const activeSub = sub ? findCategoryBySlug(allCategories, sub) : undefined;
  const searchCatId = activeSub?.id || activeCat?.id;
  const categoryById = (categoryId: number) => findCategoryById(allCategories, categoryId);

  const { data: listings, isLoading } = useQuery({
    queryKey: ["listings", q, searchCatId],
    queryFn: async () => {
      const params: any = { page: 1, limit: 50 };
      if (q) params.q = q;
      if (searchCatId) params.categoryId = searchCatId;

      const { data } = await apiClient.get<{ data: Listing[], meta: any }>("/advertisements", { params });
      return data.data || [];
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <div className="border-b bg-secondary/30">
        <div className="mx-auto max-w-7xl px-4 py-6">
          <form
            onSubmit={(e) => { e.preventDefault(); navigate({ search: (p: z.infer<typeof searchSchema>) => ({ ...p, q: term }) }); }}
            className="flex gap-2"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Search items…" className="pl-9 h-11" />
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
              {allCategories.map((c) => (
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
                {activeSub ? activeSub.name : (activeCat ? activeCat.name : "All listings")}
                {q && <span className="text-muted-foreground font-normal"> · "{q}"</span>}
              </h1>
              <p className="text-sm text-muted-foreground">{listings?.length ?? 0} results</p>
            </div>
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
                <article key={l.id} className="group rounded-xl border bg-card overflow-hidden hover:shadow-lg hover:border-brand transition">
                  <div className="aspect-[4/3] bg-accent grid place-items-center overflow-hidden">
                    {l.images && l.images.length > 0 ? (
                      <img src={l.images[0]} alt={l.title} className="h-full w-full object-cover group-hover:scale-105 transition" />
                    ) : (
                      <Package className="h-10 w-10 text-brand/60" />
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold line-clamp-1">{l.title}</h3>
                        <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                          <span className="rounded-full bg-secondary px-2 py-0.5">
                            {categoryById(l.categoryId)?.name ?? `Category ${l.categoryId}`}
                          </span>
                        </div>
                      </div>
                    </div>
                    {l.description && <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{l.description}</p>}
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <span className="text-lg font-semibold text-brand">
                          Rs {Number(l.price).toLocaleString()}
                        </span>
                        <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5" />
                          <span>Seller {l.user ? `${l.user.firstName} ${l.user.lastName}` : `#${l.userId}`}</span>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(l.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </article>
              ))}
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
    </div>
  );
}
