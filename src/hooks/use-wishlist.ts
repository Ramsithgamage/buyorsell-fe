import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export type WishlistAd = {
  id: number;
  title: string;
  slug: string;
  description: string;
  price: number;
  userId: number;
  categoryId: number;
  images: string[];
  isActive: boolean;
  user?: { firstName: string; lastName: string };
  category?: { id: number; name: string; slug: string };
};

export type WishlistItem = {
  id: number;
  advertisementId: number;
  createdAt: string;
  advertisement: WishlistAd;
};

export type WishlistPage = {
  data: WishlistItem[];
  meta: { totalItems: number; itemCount: number; itemsPerPage: number; totalPages: number; currentPage: number };
};

const hasToken = () => typeof window !== "undefined" && !!localStorage.getItem("access_token");

/** IDs of every wishlisted ad (drives filled hearts). Empty when logged out. */
export function useWishlistIds() {
  return useQuery({
    queryKey: ["wishlist", "ids"],
    queryFn: async () => ((await api("/wishlist/ids")) ?? []) as number[],
    enabled: hasToken(),
    retry: false,
  });
}

export function useWishlist(page: number, limit = 12) {
  return useQuery({
    queryKey: ["wishlist", "list", page, limit],
    queryFn: async () => (await api(`/wishlist?page=${page}&limit=${limit}`)) as WishlistPage,
    enabled: hasToken(),
    retry: false,
  });
}

/** Add/remove with an optimistic update of the ids cache. */
export function useToggleWishlist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ adId, wishlisted }: { adId: number; wishlisted: boolean }) => {
      await api(`/wishlist/${adId}`, { method: wishlisted ? "DELETE" : "POST" });
    },
    onMutate: async ({ adId, wishlisted }) => {
      await queryClient.cancelQueries({ queryKey: ["wishlist", "ids"] });
      const previous = queryClient.getQueryData<number[]>(["wishlist", "ids"]);
      queryClient.setQueryData<number[]>(["wishlist", "ids"], (old = []) =>
        wishlisted ? old.filter((id) => id !== adId) : [...old, adId],
      );
      return { previous };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(["wishlist", "ids"], ctx.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["wishlist"] }),
  });
}

export function useClearWishlist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await api("/wishlist", { method: "DELETE" });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["wishlist"] }),
  });
}
