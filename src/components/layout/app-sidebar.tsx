"use client";

import { useEffect, useMemo, useState } from "react";
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
  Menu,
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
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useUi } from "@/lib/hooks/useUi";
import { selectUi } from "@/lib/features/ui/uiSlice";
import { useCustomRouter } from "@/lib/hooks/useCustomRouter";

export function AppSidebar({ children }: { children: React.ReactNode }) {
  const router = useCustomRouter();
  const { updateSideBarState } = useUi();
  const { sideBarState } = useAppSelector(selectUi);
  const [showOpenButton, setShowOpenButton] = useState(false);
  const pathname = usePathname();
  const { user } = useAppSelector(selectAuth);
  const { signOut } = useAuth();

  useEffect(() => {
    // if the pathname is an admin only and the user is not an admin, redirect to the home page
    if (
      navItems.some(
        item =>
          item.adminOnly && item.href === pathname && !user?.meta?.isAdmin,
      )
    ) {
      router.push("/home");
    }
  }, [pathname, user?.meta?.isAdmin]);

  const sidebarCollapsed = useMemo(
    () => sideBarState === "collapsed",
    [sideBarState],
  );

  const handleUpdateSideBarState = (state: "collapsed" | "expanded") => {
    updateSideBarState(state);
  };

  // Filter nav items by location
  const bottomNavItems = navItems.filter(
    item => item.locationInMobile === "bottom",
  );
  const sidebarNavItems = navItems.filter(
    item => item.locationInMobile === "sidebar" || !item.locationInMobile,
  );

  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <div className="w-screen h-screen flex flex-col">
      {/* Main content area with sidebar for desktop */}
      <div className="flex-1 flex w-full h-[calc(100%-64px)] overflow-hidden">
        {/* Desktop Sidebar */}
        <div
          className={cn(
            "h-full bg-background border-r border-border flex-col transition-all duration-300 relative z-50 hidden md:flex",
            sidebarCollapsed ? "w-16" : "w-64",
          )}
        >
          <div
            className="flex items-center justify-between p-4 border-b border-border relative"
            onMouseEnter={() => setShowOpenButton(sidebarCollapsed && true)}
            onMouseLeave={() => setShowOpenButton(false)}
          >
            <SidebarOpen
              onClick={() => handleUpdateSideBarState("expanded")}
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
              withText={!sidebarCollapsed}
              className={cn("z-10", {
                "opacity-0": showOpenButton,
              })}
            />
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() =>
              handleUpdateSideBarState(
                sidebarCollapsed ? "expanded" : "collapsed",
              )
            }
            className={cn("ml-auto absolute top-2.5 right-0 hidden md:flex", {
              "!hidden": sidebarCollapsed,
            })}
          >
            <SidebarClose size={18} />
          </Button>
          <Separator orientation="vertical" />

          <nav className="flex-1 py-4 overflow-y-auto">
            <ul className="space-y-2 px-2">
              {navItems.map(item =>
                item.adminOnly && !user?.meta?.isAdmin ? null : (
                  <li key={item.name}>
                    <TooltipProvider delayDuration={0}>
                      <Tooltip>
                        <TooltipTrigger asChild>
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
                            {!sidebarCollapsed && <span>{item.name}</span>}
                          </Link>
                        </TooltipTrigger>
                        {sidebarCollapsed && (
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
                ),
              )}
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
                    sidebarCollapsed && "justify-center",
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
                  {!sidebarCollapsed && (
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
        <div id="main-content-scroll" className="flex-1 overflow-auto">
          {children}
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden h-16 w-full border-t border-border flex items-center justify-around bg-background absolute bottom-0 left-0 right-0 z-50">
        {bottomNavItems.map(item => (
          <Link
            key={item.name}
            href={item.disabled ? "" : item.href}
            className={cn(
              "flex flex-col items-center justify-center w-16 h-full",
              isActive(item.href) ? "text-primary" : "text-muted-foreground",
              item.disabled && "opacity-50 pointer-events-none",
            )}
          >
            <item.icon size={20} />
            <span className="text-xs mt-1">{item.mobileName}</span>
          </Link>
        ))}

        {/* Mobile Sidebar Trigger for other navigation items */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="h-full">
              <Menu size={20} />
              {/* <span className="text-xs mt-1">Menu</span> */}
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="w-72 pt-6 flex flex-col justify-between h-screen"
          >
            <div>
              <Logo withText className="mb-4" />
              <nav className="py-4">
                <ul className="space-y-2">
                  {sidebarNavItems.map(item =>
                    item.adminOnly && !user?.meta?.isAdmin ? null : (
                      <li key={item.name}>
                        <Link
                          href={item.disabled ? "" : item.href}
                          target={item.newTab ? "_blank" : "_self"}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                            isActive(item.href)
                              ? "text-primary"
                              : "text-foreground hover:bg-muted",
                            item.disabled && "cursor-not-allowed opacity-50",
                          )}
                        >
                          <item.icon size={20} />
                          <span>{item.mobileName}</span>
                          {item.newTab && (
                            <ExternalLink size={12} className="ml-auto" />
                          )}
                        </Link>
                      </li>
                    ),
                  )}
                </ul>
              </nav>
            </div>
            {/* Mobile User Profile */}
            <div className="mt-auto border-t border-border pt-4">
              <div className="flex items-center gap-3 px-4 mb-4">
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={user?.image || ""}
                    alt={user?.displayName || "User"}
                  />
                  <AvatarFallback>
                    <User size={16} />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 overflow-hidden">
                  <p className="truncate font-medium text-sm">
                    {user?.displayName || "User"}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 px-4">
                <Button variant="outline" size="sm" className="flex-1" asChild>
                  <Link href="/settings">
                    <Settings size={16} className="mr-2" />
                    Settings
                  </Link>
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="flex-1"
                  onClick={signOut}
                >
                  <LogOut size={16} className="mr-2" />
                  Log out
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
