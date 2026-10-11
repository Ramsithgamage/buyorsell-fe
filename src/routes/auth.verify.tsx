import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LeafyGreen, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { z } from "zod";
import { api } from "@/lib/api";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";

const searchSchema = z.object({
  token: z.string().optional(),
});

export const Route = createFileRoute("/auth/verify")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Verify your email — Verdant" },
      { name: "description", content: "Complete your Verdant account setup by verifying your email address." },
    ],
  }),
  component: VerifyPage,
});

type VerifyState = "loading" | "success" | "error";

function VerifyPage() {
  const navigate = useNavigate();
  const { token } = Route.useSearch();
  const [state, setState] = useState<VerifyState>("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setState("error");
      setMessage("No verification token was provided. Please check your email link and try again.");
      return;
    }

    let cancelled = false;

    const verify = async () => {
      try {
        const data = await api(`/auth/verify?token=${encodeURIComponent(token)}`);
        if (!cancelled) {
          setState("success");
          setMessage(data?.message ?? "Your email has been verified successfully. You can now sign in.");
        }
      } catch (err: any) {
        if (!cancelled) {
          setState("error");
          setMessage(err.message ?? "Verification failed. The link may have expired or already been used.");
        }
      }
    };

    verify();
    return () => { cancelled = true; };
  }, [token]);

  // Auto-redirect to /auth after success
  useEffect(() => {
    if (state !== "success") return;
    const timer = setTimeout(() => navigate({ to: "/auth" }), 3000);
    return () => clearTimeout(timer);
  }, [state, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-md px-4 py-20">
        <div className="rounded-2xl border bg-card p-8 shadow-sm text-center">
          {/* Icon */}
          <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-2xl bg-brand/10">
            {state === "loading" && (
              <Loader2 className="h-8 w-8 text-brand animate-spin" />
            )}
            {state === "success" && (
              <CheckCircle className="h-8 w-8 text-emerald-500" />
            )}
            {state === "error" && (
              <XCircle className="h-8 w-8 text-destructive" />
            )}
          </div>

          {/* Logo mark */}
          <div className="mx-auto mb-4 grid h-10 w-10 place-items-center rounded-xl bg-brand text-brand-foreground">
            <LeafyGreen className="h-5 w-5" />
          </div>

          {/* Heading */}
          <h1 className="text-2xl font-semibold text-foreground">
            {state === "loading" && "Verifying your email\u2026"}
            {state === "success" && "Email verified!"}
            {state === "error" && "Verification failed"}
          </h1>

          {/* Body */}
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            {state === "loading"
              ? "Please wait while we confirm your email address."
              : message}
          </p>

          {/* Redirect notice on success */}
          {state === "success" && (
            <p className="mt-2 text-xs text-muted-foreground">
              You&apos;ll be redirected to sign in automatically in a moment.
            </p>
          )}

          {/* CTA */}
          <div className="mt-8">
            {state === "success" && (
              <Button
                className="w-full bg-brand text-brand-foreground hover:opacity-90"
                onClick={() => navigate({ to: "/auth" })}
              >
                Sign in now
              </Button>
            )}
            {state === "error" && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate({ to: "/auth" })}
              >
                Back to sign in
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
