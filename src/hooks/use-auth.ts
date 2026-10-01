import { useProfile } from "@/hooks/use-profile";

/**
 * Convenience hook that wraps useProfile() and exposes role-based booleans.
 * Use this anywhere you need to know the current user's role or authentication state.
 *
 * @example
 * const { isAdmin, isVendor, user } = useAuth();
 */
export function useAuth() {
  const { data: user, isLoading } = useProfile();

  return {
    user: user ?? null,
    isLoading,
    isAuthenticated: !!user,
    isUser: user?.role === "USER",
    isVendor: user?.role === "VENDOR",
    isAdmin: user?.role === "ADMIN",
    role: user?.role ?? null,
    isApproved: user?.approvalStatus === "APPROVED",
    isPending: user?.approvalStatus === "PENDING",
  };
}
