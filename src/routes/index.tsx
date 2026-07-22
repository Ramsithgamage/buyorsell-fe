import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Search, ShieldCheck, Star, Store, Tag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import hero from "@/assets/hero.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Verdant — Buy & sell anything, locally" },
      { name: "description", content: "A calm marketplace to list, browse and rate. Discover thousands of items across every category." },
      { property: "og:title", content: "Verdant — Buy & sell anything, locally" },
      { property: "og:description", content: "A calm marketplace to list, browse and rate. Discover thousands of items across every category." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

type Category = { id: string; name: string; slug: string; icon: string | null };

function Landing() {
  const { data: categories } = useQuery({
    queryKey: ["home-categories"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("id,name,slug,icon").order("name");
      return (data ?? []) as Category[];
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden bg-hero-radial text-brand-foreground">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 md:grid-cols-2 md:py-24 md:items-center">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs uppercase tracking-wider">
              <Tag className="h-3.5 w-3.5" /> Free to list
            </span>
            <h1 className="mt-5 text-4xl md:text-6xl font-semibold leading-[1.05]">
              A marketplace that feels<br /><span className="italic text-brand-glow">good to browse.</span>
            </h1>
            <p className="mt-5 max-w-lg text-white/80 text-lg">
              List an item in minutes. Find what you need across categories from electronics to vehicles. Rate every seller.
            </p>
            <form
              className="mt-8 flex max-w-xl gap-2 rounded-full border border-white/25 bg-white/10 p-1.5 backdrop-blur"
              onSubmit={(e) => {
                e.preventDefault();
                const q = new FormData(e.currentTarget).get("q") as string;
                window.location.href = `/browse?q=${encodeURIComponent(q ?? "")}`;
              }}
            >
              <Input name="q" placeholder="Search bikes, cameras, sofas…" className="border-0 bg-transparent text-white placeholder:text-white/60 focus-visible:ring-0" />
              <Button type="submit" className="rounded-full bg-white text-brand hover:bg-white/90">
                <Search className="h-4 w-4 mr-1.5" />Search
              </Button>
            </form>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/auth"><Button size="lg" className="bg-brand-glow text-brand hover:opacity-90">Start selling <ArrowRight className="ml-1.5 h-4 w-4" /></Button></Link>
              <Link to="/browse"><Button size="lg" variant="outline" className="border-white/30 bg-transparent text-white hover:bg-white/10">Browse items</Button></Link>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-6 rounded-3xl bg-brand-glow/20 blur-2xl" />
            <img src={hero} alt="Curated items for sale" className="relative rounded-2xl border border-white/10 shadow-2xl" />
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-3xl font-semibold">Browse categories</h2>
            <p className="text-muted-foreground mt-1">Every corner of the market has a home.</p>
          </div>
          <Link to="/browse" className="text-sm text-brand hover:underline">View all →</Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {(categories ?? []).map((c) => (
            <Link
              key={c.id}
              to="/browse"
              search={{ q: "", category: c.slug }}
              className="group rounded-2xl border bg-card p-5 transition hover:border-brand hover:shadow-lg"
            >
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-accent text-brand transition group-hover:bg-brand group-hover:text-brand-foreground">
                <Store className="h-5 w-5" />
              </div>
              <div className="mt-4 font-medium">{c.name}</div>
              <div className="mt-1 text-xs text-muted-foreground">Explore listings</div>
            </Link>
          ))}
        </div>
      </section>

      {/* Value props */}
      <section className="bg-secondary/40 border-y">
        <div className="mx-auto max-w-7xl px-4 py-16 grid md:grid-cols-3 gap-8">
          {[
            { icon: Tag, title: "List in minutes", desc: "Photo, price, category. Live instantly." },
            { icon: ShieldCheck, title: "Trusted sellers", desc: "Every seller has public ratings from real buyers." },
            { icon: Star, title: "Rate & review", desc: "Help the community. Rate sellers after every deal." },
          ].map((f) => (
            <div key={f.title} className="rounded-2xl bg-card border p-6">
              <f.icon className="h-6 w-6 text-brand" />
              <div className="mt-3 font-semibold text-lg">{f.title}</div>
              <p className="mt-1 text-muted-foreground text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="mx-auto max-w-7xl px-4 py-10 text-sm text-muted-foreground flex flex-wrap gap-4 justify-between">
        <span>© {new Date().getFullYear()} Verdant Marketplace</span>
        <div className="flex gap-4">
          <Link to="/browse" className="hover:text-foreground">Browse</Link>
          <Link to="/auth" className="hover:text-foreground">Sign in</Link>
        </div>
      </footer>
    </div>
  );
}
