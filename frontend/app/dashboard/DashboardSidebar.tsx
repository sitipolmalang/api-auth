"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity,
  BadgeCheck,
  Bell,
  ChartNoAxesCombined,
  CreditCard,
  ChevronsUpDown,
  Globe,
  LayoutTemplate,
  LogOut,
  PanelLeft,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { getCsrfHeaders } from "@/lib/csrf";

type SidebarUser = {
  name: string;
  email: string;
  role: string;
};

type DashboardSidebarProps = {
  user: SidebarUser;
  children: ReactNode;
};

type LinkItem = {
  href: string;
  label: string;
  icon: ReactNode;
};

type SoonItem = {
  label: string;
  icon: ReactNode;
};

function SidebarNavLink({
  href,
  children,
  className,
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  const { isMobile, setOpenMobile } = useSidebar();

  return (
    <Link
      href={href}
      className={className}
      onClick={() => {
        if (isMobile) {
          setOpenMobile(false);
        }
      }}
    >
      {children}
    </Link>
  );
}

const mainLinks: LinkItem[] = [
  { href: "/dashboard/users", label: "Dashboard", icon: <Users className="size-4" /> },
  { href: "/dashboard/websites", label: "Websites", icon: <Globe className="size-4" /> },
];

const mainSoonItems: SoonItem[] = [
  { label: "Subscriptions", icon: <CreditCard className="size-4" /> },
  { label: "Analytics", icon: <ChartNoAxesCombined className="size-4" /> },
];

const otherLinks: LinkItem[] = [
  { href: "/templates", label: "Templates", icon: <LayoutTemplate className="size-4" /> },
  { href: "/dashboard/activities", label: "Activities", icon: <Activity className="size-4" /> },
];

function isAdminRole(role: string): boolean {
  return role.toLowerCase() === "admin";
}

function roleLabel(role: string): string {
  return isAdminRole(role) ? "Admin" : "User";
}

function getInitials(name: string): string {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) {
    return "U";
  }

  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("");
}

function SidebarUserProfile({ user }: { user: SidebarUser }) {
  const { isMobile } = useSidebar();
  const router = useRouter();
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    let isSuccess = false;

    try {
      await getCsrfHeaders();

      const logoutResponse = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
        headers: { Accept: "application/json" },
      });

      if (!logoutResponse.ok) {
        throw new Error(`Logout failed with status ${logoutResponse.status}`);
      }

      const revalidateResponse = await fetch("/api/auth/session/revalidate", {
        method: "POST",
        credentials: "include",
        headers: { Accept: "application/json" },
      });

      if (!revalidateResponse.ok) {
        throw new Error(`Revalidate failed with status ${revalidateResponse.status}`);
      }

      isSuccess = true;
    } catch (error) {
      console.error("Logout failed", error);
      window.alert("Logout gagal. Silakan coba lagi.");
    } finally {
      setIsLoggingOut(false);
      setIsLogoutDialogOpen(false);

      if (isSuccess) {
        router.push("/login");
        router.refresh();
      }
    }
  };

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton size="lg" className="data-[state=open]:bg-zinc-100">
                <Avatar className="size-8 rounded-lg">
                  <AvatarFallback className="rounded-lg bg-zinc-900 text-xs text-white">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold text-zinc-900">{user.name}</span>
                  <span className="truncate text-xs text-zinc-500">{user.email}</span>
                </div>
                <ChevronsUpDown className="ml-auto size-4 text-zinc-500" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
              side={isMobile ? "bottom" : "right"}
              align="end"
              sideOffset={4}
            >
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar className="size-8 rounded-lg">
                    <AvatarFallback className="rounded-lg bg-zinc-900 text-xs text-white">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold text-zinc-900">{user.name}</span>
                    <span className="truncate text-xs text-zinc-500">{user.email}</span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuItem disabled>{roleLabel(user.role)}</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem>
                  <Sparkles />
                  Upgrade to Pro
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem>
                  <BadgeCheck />
                  Account
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <CreditCard />
                  Billing
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Bell />
                  Notifications
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onSelect={(event) => {
                  event.preventDefault();
                  setIsLogoutDialogOpen(true);
                }}
              >
                <LogOut />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      <ConfirmDialog
        open={isLogoutDialogOpen}
        onOpenChange={setIsLogoutDialogOpen}
        title="Logout sekarang?"
        description="Kamu akan keluar dari sesi saat ini dan perlu login lagi untuk masuk."
        confirmLabel="Logout"
        cancelLabel="Batal"
        confirmVariant="destructive"
        isLoading={isLoggingOut}
        onConfirm={handleLogout}
      />
    </>
  );
}

export default function DashboardSidebar({ user, children }: DashboardSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const adminLinks: LinkItem[] = isAdminRole(user.role)
    ? [{ href: "/dashboard/admin", label: "Admin", icon: <ShieldCheck className="size-4" /> }]
    : [];
  const allOtherLinks = [...otherLinks, ...adminLinks];

  useEffect(() => {
    const prefetchTargets = [
      ...mainLinks.map((item) => item.href),
      ...otherLinks.map((item) => item.href),
      ...(isAdminRole(user.role) ? ["/dashboard/admin"] : []),
    ];

    prefetchTargets.forEach((href) => {
      router.prefetch(href);
    });
  }, [router, user.role]);

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon" variant="inset" className="border-zinc-200">
        <SidebarHeader className="h-14 justify-center border-b border-zinc-200 px-2">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild size="lg" className="data-[active=true]:bg-zinc-100">
                <SidebarNavLink href="/dashboard/users">
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-zinc-900 text-white">
                    <PanelLeft className="size-4" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate text-xs uppercase tracking-[0.2em] text-zinc-500">
                      Logo
                    </span>
                    <span className="truncate font-semibold text-zinc-900">OyiWeb</span>
                  </div>
                </SidebarNavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Main</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {mainLinks.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.href}
                      tooltip={item.label}
                      className="transition-[background-color,color,transform] duration-200 ease-out hover:translate-x-0.5"
                    >
                      <SidebarNavLink href={item.href}>
                        {item.icon}
                        <span>{item.label}</span>
                      </SidebarNavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}

                {mainSoonItems.map((item) => (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton
                      disabled
                      tooltip={`${item.label} (Soon)`}
                      className="cursor-not-allowed opacity-60"
                    >
                      {item.icon}
                      <span>{item.label}</span>
                      <span className="ml-auto rounded-full bg-zinc-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                        Soon
                      </span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel>Other</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {allOtherLinks.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.href}
                      tooltip={item.label}
                      className="transition-[background-color,color,transform] duration-200 ease-out hover:translate-x-0.5"
                    >
                      <SidebarNavLink href={item.href}>
                        {item.icon}
                        <span>{item.label}</span>
                      </SidebarNavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <SidebarUserProfile user={user} />
        </SidebarFooter>

        <SidebarRail />
      </Sidebar>

      <SidebarInset>
        <header className="sticky top-0 z-20 flex h-14 items-center border-b border-zinc-200 bg-white/90 px-4 backdrop-blur-sm">
          <SidebarTrigger className="-ml-1" />
          <p className="ml-2 text-sm font-medium text-zinc-600">Dashboard Workspace</p>
        </header>
        <section className="flex-1 px-4 py-6 lg:px-8">{children}</section>
      </SidebarInset>
    </SidebarProvider>
  );
}
