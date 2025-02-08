import {
  Calendar,
  Home,
  Inbox,
  Lightbulb,
  Pencil,
  Search,
  Settings,
  User,
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
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAppSelector } from "@/lib/hooks/redux";
import { selectAuth } from "@/lib/features/auth/authSlice";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const appName = process.env.NEXT_PUBLIC_APP_NAME;

const items = [
  {
    title: "Editor",
    url: "/editor",
    icon: Pencil,
  },
  // {
  //   title: "Ideas management",
  //   url: "/ideas",
  //   icon: Lightbulb,
  // },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { user, loading } = useAppSelector(selectAuth);

  return (
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
            <Button variant="ghost" className="flex w-full items-center gap-3 rounded-md p-2 text-left text-sm hover:bg-sidebar-accent">
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
              </div>
            </Button>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
