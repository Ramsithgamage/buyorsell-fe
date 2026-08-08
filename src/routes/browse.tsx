import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";
import { Search, MapPin, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const searchSchema = z.object({
  q: z.string().default("").catch(""),
  category: z.string().default("").catch(""),
  sub: z.string().default("").catch(""),
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

type Cat = { id: string; name: string; slug: string };
type Sub = { id: string; name: string; slug: string; category_id: string };
type Listing = {
  id: string; title: string; description: string | null; price: number; currency: string;
  condition: string; location: string | null; image_url: string | null; created_at: string;
  category_id: string | null; subcategory_id: string | null;
};

function Browse() {
  const { q, category, sub } = Route.useSearch();
  const navigate = Route.useNavigate();
  const [term, setTerm] = useState(q);

  const { data: categories } = useQuery({
    queryKey: ["cats"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("id,name,slug").order("name");
      return (data ?? []) as Cat[];
    },
  });

  const activeCat = categories?.find((c) => c.slug === category);

  const { data: subs } = useQuery({
    queryKey: ["subs", activeCat?.id],
    enabled: !!activeCat?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("subcategories").select("id,name,slug,category_id")
        .eq("category_id", activeCat!.id).order("name");
      return (data ?? []) as Sub[];
    },
  });

  const { data: listings, isLoading } = useQuery({
    queryKey: ["listings", q, category, sub, activeCat?.id, subs?.find((s) => s.slug === sub)?.id],
    queryFn: async () => {
      let query = supabase.from("listings")
        .select("id,title,description,price,currency,condition,location,image_url,created_at,category_id,subcategory_id")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(60);
      if (q) query = query.ilike("title", `%${q}%`);
      if (activeCat) query = query.eq("category_id", activeCat.id);
      const activeSub = subs?.find((s) => s.slug === sub);
      if (activeSub) query = query.eq("subcategory_id", activeSub.id);
      const { data } = await query;
      return (data ?? []) as Listing[];
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
                {activeCat ? activeCat.name : "All listings"}
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
                    {l.image_url ? (
                      <img src={l.image_url} alt={l.title} className="h-full w-full object-cover group-hover:scale-105 transition" />
                    ) : (
                      <Package className="h-10 w-10 text-brand/60" />
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold line-clamp-1">{l.title}</h3>
                      <Badge variant="secondary" className="shrink-0">{l.condition}</Badge>
                    </div>
                    {l.description && <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{l.description}</p>}
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-lg font-semibold text-brand">
                        {l.currency} {Number(l.price).toLocaleString()}
                      </span>
                      {l.location && (
                        <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                          <MapPin className="h-3 w-3" />{l.location}
                        </span>
                      )}
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
