import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LeafyGreen, Search, LogOut, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";

export function SiteHeader() {
  const [user, setUser] = useState<{ email: string } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setUser({ email: payload.email || "User" });
      } catch (e) {
        setUser({ email: "User" });
      }
    }
  }, []);

  const signOut = async () => {
    try {
      await apiFetch("/auth/logout", { method: "POST" });
    } catch (error) {
      console.error("Failed to call logout endpoint:", error);
    }
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setUser(null);
    navigate({ to: "/" });
  };

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand text-brand-foreground">
            <LeafyGreen className="h-5 w-5" />
          </span>
          <span className="text-lg tracking-tight">Verdant</span>
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
          <Link to="/browse" className="hover:text-foreground transition">Browse</Link>
          <Link to="/browse" search={{ q: "", category: "electronics" }} className="hover:text-foreground transition">Electronics</Link>
          <Link to="/browse" search={{ q: "", category: "fashion" }} className="hover:text-foreground transition">Fashion</Link>
          <Link to="/browse" search={{ q: "", category: "vehicles" }} className="hover:text-foreground transition">Vehicles</Link>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Link to="/browse" className="hidden sm:inline-flex">
            <Button variant="ghost" size="sm"><Search className="h-4 w-4 mr-1.5" />Search</Button>
          </Link>
          {user ? (
            <>
              <span className="hidden sm:flex items-center gap-1.5 text-sm text-muted-foreground">
                <UserIcon className="h-4 w-4" />{user.email}
              </span>
              <Button size="sm" variant="outline" onClick={signOut}>
                <LogOut className="h-4 w-4 mr-1.5" />Sign out
              </Button>
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
