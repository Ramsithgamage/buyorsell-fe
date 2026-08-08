import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  ChevronRight,
  Search,
  Store,
  Truck,
  ShieldCheck,
  Wallet,
  Headphones,
  Zap,
  Star,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import hero from "@/assets/hero.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Verdant — Online Shopping Marketplace in Sri Lanka" },
      {
        name: "description",
        content:
          "Shop flash deals, browse every category and discover thousands of items from trusted sellers on Verdant marketplace.",
      },
      { property: "og:title", content: "Verdant — Online Shopping Marketplace" },
      {
        property: "og:description",
        content: "Flash deals, categories and thousands of listings from trusted sellers.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

type Category = { id: string; name: string; slug: string; icon: string | null };
type Listing = {
  id: string;
  title: string;
  price: number;
  currency: string;
  condition: string;
  location: string | null;
  image_url: string | null;
};

function useCountdown(seconds: number) {
  const [left, setLeft] = useState(seconds);
  useEffect(() => {
    const t = setInterval(() => setLeft((v) => (v <= 0 ? seconds : v - 1)), 1000);
    return () => clearInterval(t);
  }, [seconds]);
  const h = String(Math.floor(left / 3600)).padStart(2, "0");
  const m = String(Math.floor((left % 3600) / 60)).padStart(2, "0");
  const s = String(left % 60).padStart(2, "0");
  return [h, m, s];
}

function Price({ value, currency }: { value: number; currency: string }) {
  return (
    <div className="mt-1 font-semibold text-brand">
      {currency} {Number(value).toLocaleString()}
    </div>
  );
}

function ProductCard({ l }: { l: Listing }) {
  return (
    <Link
      to="/browse"
      search={{ q: l.title, category: "", sub: "" }}
      className="group overflow-hidden rounded-lg border bg-card transition hover:shadow-lg"
    >
      <div className="aspect-square overflow-hidden bg-muted">
        {l.image_url ? (
          <img
            src={l.image_url}
            alt={l.title}
            loading="lazy"
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-muted-foreground">
            <Store className="h-8 w-8" />
          </div>
        )}
      </div>
      <div className="p-3">
        <div className="line-clamp-2 min-h-10 text-sm">{l.title}</div>
        <Price value={l.price} currency={l.currency} />
        <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
          <Star className="h-3 w-3 fill-brand-glow text-brand-glow" />
          4.6
          <span className="mx-1">•</span>
          {l.location ?? "Sri Lanka"}
        </div>
      </div>
    </Link>
  );
}

function Landing() {
  const [h, m, s] = useCountdown(6 * 3600 + 42 * 60);

  const { data: categories } = useQuery({
    queryKey: ["home-categories"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("id,name,slug,icon").order("name");
      return (data ?? []) as Category[];
    },
  });

  const { data: listings } = useQuery({
    queryKey: ["home-listings"],
    queryFn: async () => {
      const { data } = await supabase
        .from("listings")
        .select("id,title,price,currency,condition,location,image_url")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(24);
      return (data ?? []) as Listing[];
    },
  });

  const flash = (listings ?? []).slice(0, 6);
  const forYou = (listings ?? []).slice(0, 18);

  return (
    <div className="min-h-screen bg-secondary/30">
      <SiteHeader />

      {/* Search band */}
      <div className="bg-brand text-brand-foreground">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
          <form
            className="flex flex-1 gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const q = new FormData(e.currentTarget).get("q") as string;
              window.location.href = `/browse?q=${encodeURIComponent(q ?? "")}`;
            }}
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                name="q"
                placeholder="Search in Verdant…"
                className="h-11 border-0 bg-card pl-9 text-foreground"
              />
            </div>
            <Button type="submit" className="h-11 bg-brand-glow px-6 text-brand hover:opacity-90">
              Search
            </Button>
          </form>
          <Link to="/auth" className="hidden shrink-0 md:block">
            <Button variant="outline" className="h-11 border-white/30 bg-transparent hover:bg-white/10">
              Become a seller
            </Button>
          </Link>
        </div>
      </div>

      {/* Category rail + banner */}
      <section className="mx-auto max-w-7xl px-4 py-4">
        <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
          <aside className="hidden rounded-lg border bg-card p-2 lg:block">
            {(categories ?? []).map((c) => (
              <Link
                key={c.id}
                to="/browse"
                search={{ q: "", category: c.slug, sub: "" }}
                className="flex items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-accent"
              >
                {c.name}
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            ))}
          </aside>

          <div className="grid gap-4 md:grid-cols-[1fr_260px]">
            <div className="relative overflow-hidden rounded-lg border">
              <img src={hero} alt="Verdant marketplace deals" className="h-64 w-full object-cover md:h-80" />
              <div className="absolute inset-0 bg-hero-radial opacity-85" />
              <div className="absolute inset-0 flex flex-col justify-center p-6 text-brand-foreground md:p-10">
                <Badge className="w-fit bg-brand-glow text-brand">Mega Deals</Badge>
                <h1 className="mt-3 max-w-md text-3xl font-semibold leading-tight md:text-4xl">
                  Everything you need, from every seller
                </h1>
                <p className="mt-2 max-w-md text-sm text-white/80">
                  Thousands of listings across electronics, fashion, vehicles and more.
                </p>
                <Link to="/browse" className="mt-5">
                  <Button className="bg-brand-glow text-brand hover:opacity-90">Shop now</Button>
                </Link>
              </div>
            </div>
            <div className="grid gap-4">
              {[
                { t: "Free to list", d: "Sell in minutes", i: Store },
                { t: "Rated sellers", d: "Real buyer reviews", i: ShieldCheck },
              ].map((b) => (
                <div key={b.t} className="flex flex-col justify-center rounded-lg border bg-card p-5">
                  <b.i className="h-6 w-6 text-brand" />
                  <div className="mt-2 font-semibold">{b.t}</div>
                  <div className="text-sm text-muted-foreground">{b.d}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Service strip */}
      <section className="mx-auto max-w-7xl px-4">
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border bg-border md:grid-cols-4">
          {[
            { i: Truck, t: "Islandwide delivery" },
            { i: Wallet, t: "Cash on delivery" },
            { i: ShieldCheck, t: "Buyer protection" },
            { i: Headphones, t: "Help centre" },
          ].map((x) => (
            <div key={x.t} className="flex items-center gap-2 bg-card px-4 py-4 text-sm">
              <x.i className="h-5 w-5 shrink-0 text-brand" />
              <span className="min-w-0 truncate">{x.t}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Flash sale */}
      <section className="mx-auto max-w-7xl px-4 py-6">
        <div className="rounded-lg border bg-card p-4">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:flex sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <h2 className="flex items-center gap-2 truncate text-xl font-semibold">
                <Zap className="h-5 w-5 shrink-0 text-brand" /> Flash Sale
              </h2>
              <div className="hidden items-center gap-1 text-sm sm:flex">
                {[h, m, s].map((v, i) => (
                  <span key={i} className="rounded bg-brand px-2 py-1 font-mono text-brand-foreground">
                    {v}
                  </span>
                ))}
              </div>
            </div>
            <Link to="/browse" className="shrink-0 text-sm text-brand hover:underline">
              Shop all →
            </Link>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {flash.map((l) => (
              <ProductCard key={l.id} l={l} />
            ))}
          </div>
        </div>
      </section>

      {/* Categories grid */}
      <section className="mx-auto max-w-7xl px-4 pb-6">
        <div className="rounded-lg border bg-card p-4">
          <h2 className="text-xl font-semibold">Categories</h2>
          <div className="mt-4 grid grid-cols-3 gap-px overflow-hidden rounded-lg bg-border sm:grid-cols-4 lg:grid-cols-8">
            {(categories ?? []).map((c) => (
              <Link
                key={c.id}
                to="/browse"
                search={{ q: "", category: c.slug, sub: "" }}
                className="flex flex-col items-center gap-2 bg-card px-2 py-5 text-center transition hover:bg-accent"
              >
                <span className="grid h-12 w-12 place-items-center rounded-full bg-accent text-brand">
                  <Store className="h-5 w-5" />
                </span>
                <span className="line-clamp-2 text-xs">{c.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Just for you */}
      <section className="mx-auto max-w-7xl px-4 pb-12">
        <h2 className="mb-4 border-b-2 border-brand pb-2 text-xl font-semibold text-brand">
          Just For You
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {forYou.map((l) => (
            <ProductCard key={l.id} l={l} />
          ))}
        </div>
        <div className="mt-6 text-center">
          <Link to="/browse">
            <Button variant="outline">Load more listings</Button>
          </Link>
        </div>
      </section>

      <footer className="border-t bg-card">
        <div className="mx-auto flex max-w-7xl flex-wrap justify-between gap-4 px-4 py-10 text-sm text-muted-foreground">
          <span>© {new Date().getFullYear()} Verdant Marketplace</span>
          <div className="flex gap-4">
            <Link to="/browse" className="hover:text-foreground">Browse</Link>
            <Link to="/auth" className="hover:text-foreground">Sign in</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
