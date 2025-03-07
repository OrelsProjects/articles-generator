"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Home,
  FileText,
  KanbanSquare,
  Settings,
  PenTool,
  LogOut,
  ChevronLeft,
  ChevronRight,
  User,
  Sidebar,
  SidebarClose,
  SidebarOpen,
} from "lucide-react";
import { useAppSelector } from "@/lib/hooks/redux";
import { selectAuth } from "@/lib/features/auth/authSlice";
import useAuth from "@/lib/hooks/useAuth";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Logo from "@/components/ui/logo";
import { Separator } from "@radix-ui/react-separator";

export function AppSidebar({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const { user } = useAppSelector(selectAuth);
  const { signOut } = useAuth();

  const navItems = [
    {
      name: "Home",
      href: "/home",
      icon: Home,
    },
    {
      name: "Notes",
      href: "/notes",
      icon: FileText,
    },
    {
      name: "Status Board",
      href: "/notes/status-board",
      icon: KanbanSquare,
    },
    {
      name: "Editor",
      href: "/editor",
      icon: PenTool,
    },
    {
      name: "Settings",
      href: "/settings",
      icon: Settings,
    },
  ];

  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div
        className={cn(
          "h-screen bg-background border-r border-border flex flex-col transition-all duration-300 relative",
          collapsed ? "w-16" : "w-64",
        )}
      >
        {/* Logo and collapse button */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <Logo withText={!collapsed} />
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto absolute top-0 -right-10"
        >
          {collapsed ? <SidebarOpen size={18} /> : <SidebarClose size={18} />}
        </Button>
        <Separator orientation="vertical" />
        {/* Navigation */}
        <nav className="flex-1 py-4 overflow-y-auto">
          <ul className="space-y-2 px-2">
            {navItems.map(item => (
              <li key={item.name}>
                <TooltipProvider delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                          isActive(item.href)
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-muted",
                        )}
                      >
                        <item.icon size={20} />
                        {!collapsed && <span>{item.name}</span>}
                      </Link>
                    </TooltipTrigger>
                    {collapsed && (
                      <TooltipContent side="right">{item.name}</TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              </li>
            ))}
          </ul>
        </nav>
        {/* User profile */}
        <div className="p-4 border-t border-border">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "w-full flex items-center gap-2 justify-start",
                  collapsed && "justify-center",
                )}
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={user?.image || ""}
                    alt={user?.displayName || "User"}
                  />
                  <AvatarFallback>
                    <User size={16} />
                  </AvatarFallback>
                </Avatar>
                {!collapsed && (
                  <div className="flex-1 text-left overflow-hidden">
                    <p className="truncate font-medium text-sm">
                      {user?.displayName || "User"}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem asChild>
                <Link href="/settings" className="flex items-center gap-2">
                  <Settings size={16} />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive flex items-center gap-2"
                onClick={signOut}
              >
                <LogOut size={16} />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  );
}
