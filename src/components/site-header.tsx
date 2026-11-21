import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LeafyGreen, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import type { User } from "@supabase/supabase-js";
import { useProfile } from "@/hooks/use-profile";
import { NotificationBell } from "@/components/notification-bell";
import { UserMenu } from "@/components/user-menu";

export function SiteHeader() {
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null);
  const [hasToken, setHasToken] = useState(false);
  const { data: profile } = useProfile();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSupabaseUser(data.session?.user ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSupabaseUser(s?.user ?? null));
    
    // Check custom token on mount
    setHasToken(!!localStorage.getItem("access_token"));
    
    // Listen for storage changes across tabs
    const handleStorage = () => setHasToken(!!localStorage.getItem("access_token"));
    window.addEventListener("storage", handleStorage);
    
    return () => {
      sub.subscription.unsubscribe();
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const userEmail = profile?.email || supabaseUser?.email;
  const isAuthenticated = hasToken || !!supabaseUser;

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand text-brand-foreground">
            <LeafyGreen className="h-5 w-5" />
          </span>
          <span className="text-lg tracking-tight">Buy Or Sell</span>
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
          <Link to="/browse" search={{ q: "", category: "", sub: "" }} className="hover:text-foreground transition">Browse</Link>
          <Link to="/browse" search={{ q: "", category: "electronics", sub: "" }} className="hover:text-foreground transition">Electronics</Link>
          <Link to="/browse" search={{ q: "", category: "fashion", sub: "" }} className="hover:text-foreground transition">Fashion</Link>
          <Link to="/browse" search={{ q: "", category: "vehicles", sub: "" }} className="hover:text-foreground transition">Vehicles</Link>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Link to="/browse" search={{ q: "", category: "", sub: "" }} className="hidden sm:inline-flex">
            <Button variant="ghost" size="sm"><Search className="h-4 w-4 mr-1.5" />Search</Button>
          </Link>
          {isAuthenticated ? (
            <>
              <NotificationBell enabled={isAuthenticated} />
              <UserMenu fallbackEmail={userEmail} />
            </>
          ) : (
            <Link to="/auth">
              <Button size="sm" className="bg-brand text-brand-foreground hover:opacity-90">Sign in</Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
