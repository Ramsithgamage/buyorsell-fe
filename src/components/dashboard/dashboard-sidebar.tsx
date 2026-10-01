import { Link, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  ListOrdered,
  ShoppingBag,
  Package,
  PlusCircle,
  Users,
  ClipboardCheck,
  Megaphone,
  LeafyGreen,
  LogOut,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { api } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { UserProfile } from "@/hooks/use-profile";

// ─── Nav item definitions per role ────────────────────────────────────────────

const userNav = [
  { label: "Overview", to: "/dashboard", icon: LayoutDashboard, section: "My Account" },
  { label: "My Listings", to: "/dashboard", icon: ListOrdered, section: "My Account" },
  { label: "Purchase History", to: "/dashboard", icon: ShoppingBag, section: "My Account" },
  { label: "Post New Ad", to: "/post-ad", icon: PlusCircle, section: "Actions" },
];

const vendorNav = [
  { label: "Overview", to: "/dashboard", icon: LayoutDashboard, section: "Store" },
  { label: "Products", to: "/dashboard", icon: Package, section: "Store" },
  { label: "Add Product", to: "/post-ad", icon: PlusCircle, section: "Actions" },
];

const adminNav = [
  { label: "Overview", to: "/dashboard", icon: LayoutDashboard, section: "Platform" },
  { label: "Users", to: "/dashboard", icon: Users, section: "Platform" },
  { label: "Pending Approvals", to: "/dashboard", icon: ClipboardCheck, section: "Platform" },
  { label: "Advertisements", to: "/dashboard", icon: Megaphone, section: "Platform" },
];

// ─── Component ────────────────────────────────────────────────────────────────

interface DashboardSidebarProps {
  user: UserProfile | null;
}

export function DashboardSidebar({ user }: DashboardSidebarProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const nav =
    user?.role === "ADMIN"
      ? adminNav
      : user?.role === "VENDOR"
        ? vendorNav
        : userNav;

  // Group nav items by section
  const sections = nav.reduce<Record<string, typeof nav>>(
    (acc, item) => {
      if (!acc[item.section]) acc[item.section] = [];
      acc[item.section].push(item);
      return acc;
    },
    {},
  );

  const roleBadge =
    user?.role === "ADMIN"
      ? "Admin"
      : user?.role === "VENDOR"
        ? "Vendor"
        : "Member";

  const signOut = async () => {
    try {
      await api("/auth/logout", { method: "POST" });
    } catch {
      // ignore
    }
    await supabase.auth.signOut();
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    queryClient.setQueryData(["profile"], null);
    navigate({ to: "/" });
  };

  return (
    <Sidebar collapsible="icon">
      {/* Brand header */}
      <SidebarHeader className="border-b border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to="/" className="flex items-center gap-2">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <LeafyGreen className="h-4 w-4" />
                </span>
                <div className="flex flex-col leading-tight">
                  <span className="font-semibold text-sidebar-foreground">Verdant</span>
                  <span className="text-xs text-sidebar-foreground/60">{roleBadge} Dashboard</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <div className="px-2 pb-1">
          <SidebarTrigger className="text-sidebar-foreground/60 hover:text-sidebar-foreground" />
        </div>
      </SidebarHeader>

      {/* Nav sections */}
      <SidebarContent>
        {Object.entries(sections).map(([section, items]) => (
          <SidebarGroup key={section}>
            <SidebarGroupLabel className="text-sidebar-foreground/50 text-xs uppercase tracking-wider">
              {section}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map((item) => (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton asChild tooltip={item.label}>
                      <Link to={item.to as "/dashboard" | "/post-ad"}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      {/* Footer: user info + sign out */}
      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-2 px-2 py-1">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-sidebar-accent text-sidebar-accent-foreground text-xs font-semibold">
                {user?.firstName?.[0] ?? "?"}
              </span>
              <div className="min-w-0 flex-1 overflow-hidden leading-tight group-data-[collapsible=icon]:hidden">
                <p className="truncate text-sm font-medium text-sidebar-foreground">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="truncate text-xs text-sidebar-foreground/60">{user?.email}</p>
              </div>
            </div>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={signOut}
              tooltip="Sign out"
              className="text-sidebar-foreground/70 hover:text-sidebar-foreground"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
