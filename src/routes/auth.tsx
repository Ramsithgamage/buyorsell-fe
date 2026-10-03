import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LeafyGreen } from "lucide-react";
import { z } from "zod";
import { api } from "@/lib/api";
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
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [accountType, setAccountType] = useState<"buyer_seller" | "vendor">("buyer_seller");
  const [companyName, setCompanyName] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const accessToken = localStorage.getItem("access_token");
    if (accessToken) {
      navigate({ to: "/dashboard" });
    }
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
    if (tab === "signup" && password !== confirmPassword) return toast.error("Passwords do not match");

    setLoading(true);
    try {
      if (tab === "signup") {
        const payload = {
          email: ep.data,
          password: pp.data,
          passwordConfirm: confirmPassword,
          firstName: firstName,
          lastName: lastName,
        };

        if (accountType === "vendor") {
          await api("/auth/register/vendor", {
            method: "POST",
            body: JSON.stringify({
              ...payload,
              companyName: companyName,
              businessRegistrationNumber: registrationNumber,
            }),
          });
        } else {
          await api("/auth/register", {
            method: "POST",
            body: JSON.stringify(payload),
          });
        }

        toast.success("Account created! Please sign in.");
        setTab("signin");
      } else {
        const data = await api("/auth/login", {
          method: "POST",
          body: JSON.stringify({ email: ep.data, password: pp.data }),
        });

        if (data && data.accessToken) {
          localStorage.setItem("access_token", data.accessToken);
          if (data.refreshToken) {
            localStorage.setItem("refresh_token", data.refreshToken);
          }
          localStorage.removeItem("guest_token");
          toast.success("Welcome back");
          navigate({ to: "/dashboard" });
        } else {
          throw new Error("Invalid response from server");
        }
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
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="first-name">First Name</Label>
                    <Input id="first-name" value={firstName} onChange={(e) => setFirstName(e.target.value)} maxLength={50} />
                  </div>
                  <div>
                    <Label htmlFor="last-name">Last Name</Label>
                    <Input id="last-name" value={lastName} onChange={(e) => setLastName(e.target.value)} maxLength={50} />
                  </div>
                </div>
                <div>
                  <Label>I want to</Label>
                  <RadioGroup value={accountType} onValueChange={(v) => setAccountType(v as "buyer_seller" | "vendor")} className="mt-2 grid grid-cols-2 gap-2">
                    <label className="flex items-center gap-2 rounded-lg border p-3 cursor-pointer has-[:checked]:border-brand has-[:checked]:bg-accent">
                      <RadioGroupItem value="buyer_seller" /> Buyer/Seller
                    </label>
                    <label className="flex items-center gap-2 rounded-lg border p-3 cursor-pointer has-[:checked]:border-brand has-[:checked]:bg-accent">
                      <RadioGroupItem value="vendor" /> Vendor
                    </label>
                  </RadioGroup>
                </div>
              </TabsContent>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>

              {tab === "signup" && accountType === "vendor" && (
                <>
                  <div>
                    <Label htmlFor="company-name">Company Name</Label>
                    <Input id="company-name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />
                  </div>
                  <div>
                    <Label htmlFor="registration-number">Business Registration Number</Label>
                    <Input id="registration-number" value={registrationNumber} onChange={(e) => setRegistrationNumber(e.target.value)} required />
                  </div>
                </>
              )}

              <div>
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
              </div>

              {tab === "signup" && (
                <div>
                  <Label htmlFor="confirm-password">Password Confirmation</Label>
                  <Input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={6} />
                </div>
              )}
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
