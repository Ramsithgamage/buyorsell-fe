import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { api } from "@/lib/api";

/** Shared sign-out flow: revoke refresh token, clear sessions, reset cache, go home. */
export function useSignOut() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return async () => {
    try {
      await api("/auth/logout", { method: "POST" });
    } catch (error) {
      console.error("Logout failed:", error);
    }
    await supabase.auth.signOut();
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    // Notify listeners (e.g. SiteHeader) in the same tab; "storage" only fires cross-tab.
    window.dispatchEvent(new Event("storage"));
    queryClient.setQueryData(["profile"], null);
    navigate({ to: "/" });
  };
}
