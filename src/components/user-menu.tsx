import { Link } from "@tanstack/react-router";
import { Heart, LayoutDashboard, LogOut, User as UserIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useProfile } from "@/hooks/use-profile";
import { useSignOut } from "@/hooks/use-sign-out";

const ROLE_LABEL = { USER: "Member", VENDOR: "Vendor", ADMIN: "Admin" } as const;

export function UserMenu({ fallbackEmail }: { fallbackEmail?: string | null }) {
  const { data: profile, isLoading } = useProfile();
  const signOut = useSignOut();

  if (isLoading) return <Skeleton className="h-9 w-9 rounded-full" />;

  const fullName = profile ? `${profile.firstName} ${profile.lastName}`.trim() : "";
  const email = profile?.email ?? fallbackEmail ?? "";
  const initials = profile
    ? `${profile.firstName?.[0] ?? ""}${profile.lastName?.[0] ?? ""}`.toUpperCase()
    : (email[0] ?? "").toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Open user menu"
        className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <Avatar className="h-9 w-9">
          {profile?.avatarUrl && (
            <AvatarImage src={profile.avatarUrl} alt={fullName || "Profile picture"} />
          )}
          <AvatarFallback className="bg-brand text-brand-foreground text-sm font-semibold">
            {initials || <UserIcon className="h-4 w-4" />}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="space-y-1 font-normal">
          {fullName && <p className="truncate text-sm font-medium">{fullName}</p>}
          {email && <p className="truncate text-xs text-muted-foreground">{email}</p>}
          {profile && (
            <Badge variant="secondary" className="mt-1">
              {ROLE_LABEL[profile.role]}
            </Badge>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/profile" className="cursor-pointer">
            <UserIcon className="mr-2 h-4 w-4" />
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/wishlist" className="cursor-pointer">
            <Heart className="mr-2 h-4 w-4" />
            Wishlist
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/dashboard" className="cursor-pointer">
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Dashboard
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => void signOut()} className="cursor-pointer">
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
