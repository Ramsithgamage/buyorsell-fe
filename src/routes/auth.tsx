import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LeafyGreen } from "lucide-react";
import { z } from "zod";
import { apiFetch } from "@/lib/api";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";

const authSearchSchema = z.object({
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: authSearchSchema,
  head: () => ({
    meta: [
      { title: "Sign in or create your Verdant account" },
      { name: "description", content: "Register as a buyer or vendor and start using Verdant marketplace." },
      { property: "og:title", content: "Sign in — Verdant" },
      { property: "og:description", content: "Register as a buyer or vendor and start using Verdant." },
    ],
  }),
  component: AuthPage,
});

const emailSchema = z.string().trim().email().max(255);
const passSchema = z.string().min(6).max(100);
const nameSchema = z.string().trim().min(1).max(50);
const companySchema = z.string().trim().min(1).max(100);
const brNumberSchema = z.string().trim().min(1).max(50);
type SignupAccountType = "buyer" | "vendor";

function AuthPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [brNumber, setBrNumber] = useState("");
  const [accountType, setAccountType] = useState<SignupAccountType>("buyer");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const accessToken = localStorage.getItem("access_token");
    if (accessToken) {
      navigate({ to: (search.redirect || "/browse") as any });
    }
  }, [navigate, search.redirect]);

  const handleGoogle = async () => {
    toast.error("Google sign-in is not supported on the custom backend yet.");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ep = emailSchema.safeParse(email);
    const pp = passSchema.safeParse(password);
    const cp = passSchema.safeParse(confirmPassword);
    const fn = nameSchema.safeParse(firstName);
    const ln = nameSchema.safeParse(lastName);
    const cn = companySchema.safeParse(companyName);
    const bn = brNumberSchema.safeParse(brNumber);
    if (!ep.success) return toast.error("Enter a valid email");
    if (!pp.success) return toast.error("Password must be at least 6 characters");
    if (tab === "signup" && !cp.success) return toast.error("Confirm your password");
    if (tab === "signup" && pp.data !== cp.data) return toast.error("Passwords do not match");
    if (tab === "signup" && !fn.success) return toast.error("Enter a first name");
    if (tab === "signup" && !ln.success) return toast.error("Enter a last name");
    if (tab === "signup" && accountType === "vendor" && !cn.success) return toast.error("Enter a company name");
    if (tab === "signup" && accountType === "vendor" && !bn.success) return toast.error("Enter a BR number");

    setLoading(true);
    try {
      let endpoint = "/auth/login";
      let payload: any = { email: ep.data, password: pp.data };

      if (tab === "signup") {
        if (accountType === "vendor") {
          endpoint = "/auth/register/vendor";
          payload = { ...payload, passwordConfirm: cp.data, firstName: fn.data, lastName: ln.data, companyName: cn.data, brNumber: bn.data };
        } else {
          endpoint = "/auth/register";
          payload = { ...payload, passwordConfirm: cp.data, firstName: fn.data, lastName: ln.data };
        }
      }

      const res = await apiFetch(endpoint, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Authentication failed");
      }

      let data = await res.json();
      
      if (tab === "signup") {
        toast.success("Account created! Please check your email to verify your account before signing in.");
        setTab("signin");
        // Clear sensitive fields (optional)
        setPassword("");
        setConfirmPassword("");
        return; // Stop here, don't navigate or try to set tokens
      }
      
      if (data.accessToken) {
        localStorage.setItem("access_token", data.accessToken);
        if (data.refreshToken) {
          localStorage.setItem("refresh_token", data.refreshToken);
        }
        localStorage.removeItem("guest_token");
      }

      toast.success("Welcome back");
      navigate({ to: (search.redirect || "/browse") as any });
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
                  <Label>I am</Label>
                  <RadioGroup value={accountType} onValueChange={(v) => setAccountType(v as SignupAccountType)} className="mt-2 grid grid-cols-2 gap-2">
                    <label className="flex items-center gap-2 rounded-lg border p-3 cursor-pointer has-[:checked]:border-brand has-[:checked]:bg-accent">
                      <RadioGroupItem value="buyer" /> Buyer/Seller
                    </label>
                    <label className="flex items-center gap-2 rounded-lg border p-3 cursor-pointer has-[:checked]:border-brand has-[:checked]:bg-accent">
                      <RadioGroupItem value="vendor" /> Vendor
                    </label>
                  </RadioGroup>
                </div>

                {accountType === "vendor" ? (
                  <>
                    <div>
                      <Label htmlFor="firstNameVendor">First Name</Label>
                      <Input id="firstNameVendor" value={firstName} onChange={(e) => setFirstName(e.target.value)} maxLength={50} />
                    </div>
                    <div>
                      <Label htmlFor="lastNameVendor">Last Name</Label>
                      <Input id="lastNameVendor" value={lastName} onChange={(e) => setLastName(e.target.value)} maxLength={50} />
                    </div>
                    <div>
                      <Label htmlFor="companyName">Company Name</Label>
                      <Input id="companyName" value={companyName} onChange={(e) => setCompanyName(e.target.value)} maxLength={100} />
                    </div>
                    <div>
                      <Label htmlFor="brNumber">BR Number</Label>
                      <Input id="brNumber" value={brNumber} onChange={(e) => setBrNumber(e.target.value)} maxLength={50} />
                    </div>
                  </>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="firstName">First Name</Label>
                      <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} maxLength={50} />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} maxLength={50} />
                    </div>
                  </div>
                )}
              </TabsContent>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
              </div>
              {tab === "signup" ? (
                <div>
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={6} />
                </div>
              ) : null}
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
