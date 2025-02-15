import {
  Calendar,
  Home,
  Inbox,
  Lightbulb,
  Pencil,
  Search,
  Settings,
  User,
  LogOut,
} from "lucide-react";
import Link from "next/link";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAppSelector } from "@/lib/hooks/redux";
import { selectAuth } from "@/lib/features/auth/authSlice";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import useAuth from "@/lib/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMemo } from "react";
import { selectUi } from "@/lib/features/ui/uiSlice";

const appName = process.env.NEXT_PUBLIC_APP_NAME;

const items = [
  {
    title: "Editor",
    url: "/editor",
    icon: Pencil,
  },
];

export function AppSidebar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { signOut } = useAuth();
  const { state } = useAppSelector(selectUi);
  const { user, loading } = useAppSelector(selectAuth);

  const handleLogout = () => {
    signOut();
  };

  const plan = useMemo(() => {
    if (!user?.meta?.plan || user.meta.plan === "free") {
      return "free";
    }
    return user.meta.plan === "pro" ? "pro" : "Super Pro";
  }, [user?.meta?.plan]);

  return (
    <SidebarProvider open={state === "full"}>
      <Sidebar>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>{appName}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map(item => (
                  <SidebarMenuItem
                    key={item.title}
                    className={cn({
                      "bg-primary/10 text-primary rounded-md hover:bg-primary/20":
                        pathname === item.url,
                    })}
                  >
                    <SidebarMenuButton asChild>
                      <Link href={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <SidebarSeparator />
          <div className="p-2">
            {loading ? (
              <div className="flex w-full items-center gap-3 p-2">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-[120px]" />
                  <Skeleton className="h-3 w-[80px]" />
                </div>
              </div>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex w-full items-center gap-3 rounded-md p-2 text-left text-sm hover:bg-sidebar-accent"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.image || ""} alt="User" />
                      <AvatarFallback>
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 overflow-hidden">
                      <p className="truncate font-medium text-sidebar-foreground">
                        {user?.displayName}
                      </p>
                      <p className="truncate text-xs text-sidebar-foreground/70">
                        {user?.email}
                      </p>
                      <p className="truncate text-xs text-primary/80">{plan}</p>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-[200px]"
                  side="right"
                  sideOffset={8}
                >
                  {/* <DropdownMenuItem asChild>
                  <Link href="/settings" className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem> */}
                  {/* <DropdownMenuSeparator /> */}
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive flex items-center gap-2"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </SidebarFooter>
      </Sidebar>
      {children}
    </SidebarProvider>
  );
}
