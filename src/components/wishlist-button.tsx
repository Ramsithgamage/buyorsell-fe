import { Heart } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useProfile } from "@/hooks/use-profile";
import { useToggleWishlist, useWishlistIds } from "@/hooks/use-wishlist";

interface WishlistButtonProps {
  adId: number;
  /** Owner of the ad; owners cannot wishlist their own ads. */
  ownerId?: number;
  className?: string;
}

export function WishlistButton({ adId, ownerId, className }: WishlistButtonProps) {
  const { data: profile } = useProfile();
  const { data: ids = [] } = useWishlistIds();
  const toggle = useToggleWishlist();

  if (profile && ownerId !== undefined && profile.id === ownerId) return null;

  const wishlisted = ids.includes(adId);

  const onClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!profile) {
      toast.info("Sign in to save items to your wishlist");
      return;
    }
    toggle.mutate(
      { adId, wishlisted },
      {
        onSuccess: () => toast.success(wishlisted ? "Removed from wishlist" : "Added to wishlist"),
        onError: (err: Error) => toast.error(err.message || "Could not update wishlist"),
      },
    );
  };

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={wishlisted}
      aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
      className={cn(
        "grid h-9 w-9 place-items-center rounded-full bg-background/90 shadow-sm backdrop-blur transition hover:scale-110",
        className,
      )}
    >
      <Heart className={cn("h-5 w-5", wishlisted ? "fill-red-500 text-red-500" : "text-muted-foreground")} />
    </button>
  );
}
