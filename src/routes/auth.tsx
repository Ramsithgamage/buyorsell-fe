import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LeafyGreen } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in or create your Verdant account" },
      { name: "description", content: "Register as a buyer or seller and start using Verdant marketplace." },
      { property: "og:title", content: "Sign in — Verdant" },
      { property: "og:description", content: "Register as a buyer or seller and start using Verdant." },
    ],
  }),
  component: AuthPage,
});

const emailSchema = z.string().trim().email().max(255);
const passSchema = z.string().min(6).max(100);

function AuthPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [accountType, setAccountType] = useState<"buyer" | "seller">("buyer");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/browse", search: { q: "", category: "", sub: "" } });
    });
  }, [navigate]);

  const handleGoogle = async () => {
    const res = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (res.error) toast.error(res.error.message ?? "Google sign-in failed");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ep = emailSchema.safeParse(email);
    const pp = passSchema.safeParse(password);
    if (!ep.success) return toast.error("Enter a valid email");
    if (!pp.success) return toast.error("Password must be at least 6 characters");

    setLoading(true);
    try {
      if (tab === "signup") {
        const { error } = await supabase.auth.signUp({
          email: ep.data,
          password: pp.data,
          options: {
            emailRedirectTo: window.location.origin,
            data: { display_name: displayName || ep.data.split("@")[0], account_type: accountType },
          },
        });
        if (error) throw error;
        toast.success("Account created — you're signed in.");
        navigate({ to: "/browse", search: { q: "", category: "", sub: "" } });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: ep.data, password: pp.data });
        if (error) throw error;
        toast.success("Welcome back");
        navigate({ to: "/browse", search: { q: "", category: "", sub: "" } });
      }
    } catch (err: any) {
      toast.error(err.message ?? "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-md px-4 py-14">
        <div className="text-center mb-8">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-brand text-brand-foreground">
            <LeafyGreen className="h-6 w-6" />
          </div>
          <h1 className="mt-4 text-2xl font-semibold">Welcome to Verdant</h1>
          <p className="text-sm text-muted-foreground mt-1">Buy or sell — start in seconds.</p>
        </div>

        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <Tabs value={tab} onValueChange={(v) => setTab(v as "signin" | "signup")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Create account</TabsTrigger>
            </TabsList>

            <Button type="button" variant="outline" className="w-full mt-5" onClick={handleGoogle}>
              <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24"><path fill="#EA4335" d="M12 10v4h6a6 6 0 1 1-1.8-4.3l2.8-2.8A10 10 0 1 0 22 12z"/></svg>
              Continue with Google
            </Button>

            <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex-1 h-px bg-border" /> or with email <span className="flex-1 h-px bg-border" />
            </div>

            <form onSubmit={submit} className="space-y-4">
              <TabsContent value="signup" className="space-y-4 m-0">
                <div>
                  <Label htmlFor="name">Display name</Label>
                  <Input id="name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={50} />
                </div>
                <div>
                  <Label>I want to</Label>
                  <RadioGroup value={accountType} onValueChange={(v) => setAccountType(v as "buyer" | "seller")} className="mt-2 grid grid-cols-2 gap-2">
                    <label className="flex items-center gap-2 rounded-lg border p-3 cursor-pointer has-[:checked]:border-brand has-[:checked]:bg-accent">
                      <RadioGroupItem value="buyer" /> Buy items
                    </label>
                    <label className="flex items-center gap-2 rounded-lg border p-3 cursor-pointer has-[:checked]:border-brand has-[:checked]:bg-accent">
                      <RadioGroupItem value="seller" /> Sell items
                    </label>
                  </RadioGroup>
                </div>
              </TabsContent>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
              </div>
              <Button type="submit" className="w-full bg-brand text-brand-foreground hover:opacity-90" disabled={loading}>
                {loading ? "Please wait…" : tab === "signup" ? "Create account" : "Sign in"}
              </Button>
            </form>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
