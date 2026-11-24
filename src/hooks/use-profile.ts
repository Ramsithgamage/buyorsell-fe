import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export type UserProfile = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: "USER" | "VENDOR" | "ADMIN";
  approvalStatus: "PENDING" | "APPROVED" | "REJECTED";
  avatarUrl: string | null;
  createdAt: string;
  vendorProfile?: {
    companyName: string;
    businessRegistrationNumber: string;
  } | null;
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


/** Update first/last name. Refreshes the cached profile (header + sidebar update instantly). */
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: { firstName: string; lastName: string }) =>
      (await api("/profile", { method: "PATCH", body: JSON.stringify(values) })) as UserProfile,
    onSuccess: (data) => queryClient.setQueryData(["profile"], data),
  });
}

export function useUploadAvatar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.append("avatar", file);
      return (await api("/profile/avatar", { method: "POST", body: form })) as UserProfile;
    },
    onSuccess: (data) => queryClient.setQueryData(["profile"], data),
  });
}

export function useRemoveAvatar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => (await api("/profile/avatar", { method: "DELETE" })) as UserProfile,
    onSuccess: (data) => queryClient.setQueryData(["profile"], data),
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: async (values: {
      currentPassword: string;
      newPassword: string;
      newPasswordConfirm: string;
    }) => api("/profile/change-password", { method: "POST", body: JSON.stringify(values) }),
  });
}

export function useDeleteAccount() {
  return useMutation({
    mutationFn: async (password: string) =>
      api("/profile", { method: "DELETE", body: JSON.stringify({ password }) }),
  });
}
