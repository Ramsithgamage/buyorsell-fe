import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export type UserProfile = {
  id: number;
  email: string;
  name?: string;
  role: string;
};

export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      try {
        const data = await api("/profile");
        return data as UserProfile;
      } catch (error) {
        // Return null if profile fetch fails (e.g., logged out, invalid token)
        return null;
      }
    },
    retry: false, // Don't retry on 401s
  });
}
