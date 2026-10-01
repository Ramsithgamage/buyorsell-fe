import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export type UserProfile = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: "USER" | "VENDOR" | "ADMIN";
  approvalStatus: "PENDING" | "APPROVED" | "REJECTED";
};

export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const token = localStorage.getItem("access_token");
      if (!token) return null;
      try {
        const data = await api("/profile");
        return data as UserProfile;
      } catch {
        // Return null if profile fetch fails (e.g., logged out, invalid token)
        return null;
      }
    },
    retry: false, // Don't retry on 401s
  });
}
