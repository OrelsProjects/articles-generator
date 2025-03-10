"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Settings,
  LogOut,
  User,
  SidebarClose,
  SidebarOpen,
  ExternalLink,
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
import { navItems } from "@/types/navbar";

export function AppSidebar({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(true);
  const [showOpenButton, setShowOpenButton] = useState(false);
  const pathname = usePathname();
  const { user } = useAppSelector(selectAuth);
  const { signOut } = useAuth();

  useEffect(() => {
    if (!collapsed) {
      setShowOpenButton(false);
    }
  }, [collapsed]);

  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <div className="w-screen h-screen flex">
      <div
        className={cn(
          "h-screen bg-background border-r border-border flex flex-col transition-all duration-300 relative z-50",
          collapsed ? "w-16" : "w-64",
        )}
      >
        <div
          className="flex items-center justify-between p-4 border-b border-border relative"
          onMouseEnter={() => setShowOpenButton(collapsed && true)}
          onMouseLeave={() => setShowOpenButton(false)}
        >
          <SidebarOpen
            onClick={() => setCollapsed(false)}
            size={18}
            className={cn(
              "absolute cursor-pointer left-1/2 -translate-x-1/2 z-20",
              {
                visible: showOpenButton,
                invisible: !showOpenButton,
              },
            )}
          />
          <Logo
            withText={!collapsed}
            className={cn("z-10", {
              "opacity-0": showOpenButton,
            })}
          />
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className={cn("ml-auto absolute top-2.5 right-0 hidden md:flex", {
            "!hidden": collapsed,
          })}
        >
          <SidebarClose size={18} />
        </Button>
        <Separator orientation="vertical" />

        <nav className="flex-1 py-4 overflow-y-auto">
          <ul className="space-y-2 px-2">
            {navItems.map(item => (
              <li key={item.name}>
                <TooltipProvider delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger
                     asChild>
                      <Link
                        key={item.name}
                        href={item.disabled ? "" : item.href}
                        target={item.newTab ? "_blank" : "_self"}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                          isActive(item.href)
                            ? "text-primary"
                            : "hover:bg-muted",
                          item.disabled && "cursor-not-allowed opacity-50",
                        )}
                      >
                        <item.icon size={20} />
                        {!collapsed && <span>{item.name}</span>}
                      </Link>
                    </TooltipTrigger>
                    {collapsed && (
                      <TooltipContent
                        side="right"
                        className="flex items-center gap-2"
                      >
                        {item.name}{" "}
                        {item.newTab ? <ExternalLink size={12} /> : ""}
                      </TooltipContent>
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
