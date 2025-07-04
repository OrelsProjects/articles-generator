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
  Coins,
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Logo from "@/components/ui/logo";
import { Separator } from "@radix-ui/react-separator";
import { navItems, rootPath, categoryIcons } from "@/types/navbar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useUi } from "@/lib/hooks/useUi";
import { selectUi } from "@/lib/features/ui/uiSlice";
import { useCustomRouter } from "@/lib/hooks/useCustomRouter";
import { AffiliateDialog } from "@/components/ui/affiliate-dialog";
import { useSession } from "next-auth/react";

export function AppSidebar({ children }: { children: React.ReactNode }) {
  const router = useCustomRouter();
  const { updateSideBarState } = useUi();
  const { sideBarState } = useAppSelector(selectUi);
  const [showOpenButton, setShowOpenButton] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();
  const { user } = useAppSelector(selectAuth);
  const { signOut } = useAuth();

  const validNavItems = useMemo(() => {
    const itemsWithoutFeatureFlags = navItems.filter(
      item => !item.featureFlagsRequired,
    );
    const itemsWithFeatureFlags = navItems.filter(
      item => !itemsWithoutFeatureFlags.includes(item),
    );

    const allowedItemsWithFeatureFlags = itemsWithFeatureFlags.filter(item => {
      if (item.featureFlagsRequired) {
        const userFeatureFlags = user?.meta?.featureFlags || [];
        return item.featureFlagsRequired.some(flag =>
          userFeatureFlags.includes(flag),
        );
      }
      return true;
    });

    return [...itemsWithoutFeatureFlags, ...allowedItemsWithFeatureFlags];
  }, [user?.meta?.featureFlags]);

  useEffect(() => {
    if (!user) {
      return;
    }

    const isItemInPaths = navItems.some(item => item.href === pathname);
    if (!isItemInPaths) {
      // It's a subdomain, so we don't need to check the feature flags
      return;
    }

    const isPathnameAllowed = validNavItems.some(
      item => item.href === pathname,
    );

    const isPathnameAdminOnly = navItems.some(
      item => item.adminOnly && item.href === pathname,
    );

    // if the pathname is an admin only and the user is not an admin, redirect to the home page
    if (!isPathnameAllowed && !isPathnameAdminOnly) {
      router.push(rootPath);
    }
  }, [pathname, user?.meta?.isAdmin, validNavItems]);

  const sidebarCollapsed = useMemo(
    () => sideBarState === "collapsed",
    [sideBarState],
  );

  const handleUpdateSideBarState = (state: "collapsed" | "expanded") => {
    updateSideBarState(state);
  };

  const sortedNavItems = useMemo(() => {
    return validNavItems.sort((a, b) => a.position - b.position);
  }, [validNavItems]);

  // Group nav items by category and calculate positions
  const groupedNavItems = useMemo(() => {
    const categorized: Record<string, typeof sortedNavItems> = {};
    const uncategorized: typeof sortedNavItems = [];
    const categoryPositions: Record<string, number> = {};

    sortedNavItems.forEach(item => {
      if (item.category) {
        if (!categorized[item.category]) {
          categorized[item.category] = [];
          categoryPositions[item.category] = item.position;
        } else {
          // Update to the lowest position
          categoryPositions[item.category] = Math.min(
            categoryPositions[item.category],
            item.position,
          );
        }
        categorized[item.category].push(item);
      } else {
        uncategorized.push(item);
      }
    });

    // Create a sorted array mixing uncategorized items and categories
    const sortedMixedItems: Array<
      | { type: "item"; item: (typeof sortedNavItems)[0] }
      | {
          type: "category";
          category: string;
          items: typeof sortedNavItems;
          position: number;
        }
    > = [];

    // Add uncategorized items
    uncategorized.forEach(item => {
      sortedMixedItems.push({ type: "item", item });
    });

    // Add categories
    Object.entries(categorized).forEach(([category, items]) => {
      sortedMixedItems.push({
        type: "category",
        category,
        items,
        position: categoryPositions[category],
      });
    });

    // Sort by position
    sortedMixedItems.sort((a, b) => {
      const positionA = a.type === "item" ? a.item.position : a.position;
      const positionB = b.type === "item" ? b.item.position : b.position;
      return positionA - positionB;
    });

    return { categorized, uncategorized, sortedMixedItems };
  }, [sortedNavItems]);

  const isActive = (path: string) => {
    return pathname === path;
  };

  // Filter nav items by location
  const bottomNavItems = sortedNavItems.filter(
    item => item.locationInMobile === "bottom",
  );
  const sidebarNavItems = sortedNavItems.filter(
    item => item.locationInMobile === "sidebar" || !item.locationInMobile,
  );

  // If the pathname is a category, return the category
  const categorySelected = sortedNavItems.find(item =>
    isActive(item.href),
  )?.category;

  console.log("categorySelected", categorySelected);

  // Group sidebar nav items by category for mobile
  const groupedSidebarNavItems = useMemo(() => {
    const categorized: Record<string, typeof sidebarNavItems> = {};
    const uncategorized: typeof sidebarNavItems = [];
    const categoryPositions: Record<string, number> = {};

    sidebarNavItems.forEach(item => {
      if (item.category) {
        if (!categorized[item.category]) {
          categorized[item.category] = [];
          categoryPositions[item.category] = item.position;
        } else {
          // Update to the lowest position
          categoryPositions[item.category] = Math.min(
            categoryPositions[item.category],
            item.position,
          );
        }
        categorized[item.category].push(item);
      } else {
        uncategorized.push(item);
      }
    });

    // Create a sorted array mixing uncategorized items and categories
    const sortedMixedItems: Array<
      | { type: "item"; item: (typeof sidebarNavItems)[0] }
      | {
          type: "category";
          category: string;
          items: typeof sidebarNavItems;
          position: number;
        }
    > = [];

    // Add uncategorized items
    uncategorized.forEach(item => {
      sortedMixedItems.push({ type: "item", item });
    });

    // Add categories
    Object.entries(categorized).forEach(([category, items]) => {
      sortedMixedItems.push({
        type: "category",
        category,
        items,
        position: categoryPositions[category],
      });
    });

    // Sort by position
    sortedMixedItems.sort((a, b) => {
      const positionA = a.type === "item" ? a.item.position : a.position;
      const positionB = b.type === "item" ? b.item.position : b.position;
      return positionA - positionB;
    });

    return { categorized, uncategorized, sortedMixedItems };
  }, [sidebarNavItems]);

  const renderNavItem = (
    item: (typeof navItems)[0],
    collapsed: boolean = false,
  ) => {
    if (item.adminOnly && !user?.meta?.isAdmin) return null;

    return (
      <li key={item.name}>
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href={item.disabled ? "" : item.href}
                target={item.newTab ? "_blank" : "_self"}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                  isActive(item.href)
                    ? "text-primary hover:bg-primary/10"
                    : "hover:bg-muted",
                  item.disabled && "cursor-not-allowed opacity-50",
                )}
              >
                <item.icon size={20} />
                {!collapsed && <span>{item.name}</span>}
              </Link>
            </TooltipTrigger>
            {(collapsed || item.toolTip) && (
              <TooltipContent side="right" className="flex items-center gap-2">
                {item.toolTip || item.name}{" "}
                {item.newTab ? <ExternalLink size={12} /> : ""}
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </li>
    );
  };

  if (!session?.user) {
    return children;
  }

  return (
    <div className="w-screen h-screen flex flex-col">
      {/* Main content area with sidebar for desktop */}
      <div className="flex-1 flex w-full h-[calc(100%-64px)] overflow-hidden relative">
        {/* Desktop Sidebar */}
        <div
          className={cn(
            "h-full bg-background border-r border-border flex-col transition-all duration-300 relative z-[99999] hidden md:flex",
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
              {!sidebarCollapsed
                ? groupedNavItems.sortedMixedItems.map(mixedItem => {
                    if (mixedItem.type === "item") {
                      return renderNavItem(mixedItem.item, sidebarCollapsed);
                    } else {
                      const { category, items } = mixedItem;
                      const CategoryIcon =
                        categoryIcons[category as keyof typeof categoryIcons];
                      return (
                        <li key={category}>
                          <Accordion
                            type="single"
                            collapsible
                            className={cn("w-full")}
                            defaultValue={
                              categorySelected?.toLowerCase() ===
                              category.toLowerCase()
                                ? category
                                : undefined
                            }
                          >
                            <AccordionItem
                              value={category}
                              className="border-none"
                            >
                              <AccordionTrigger
                                className={cn(
                                  "px-3 py-2 text-base hover:no-underline hover:bg-muted rounded-md transition-colors",
                                  {
                                    "bg-primary/10 text-primary":
                                      categorySelected?.toLowerCase() ===
                                      category.toLowerCase(),
                                  },
                                )}
                                chevronClassName={cn({
                                  "text-primary":
                                    categorySelected?.toLowerCase() ===
                                    category.toLowerCase(),
                                })}
                              >
                                <div className="flex items-center gap-3 font-normal">
                                  {CategoryIcon && <CategoryIcon size={20} />}
                                  {category}
                                </div>
                              </AccordionTrigger>
                              <AccordionContent className="pb-0">
                                <ul className="space-y-1 ml-4">
                                  {items.map(item =>
                                    renderNavItem(item, false),
                                  )}
                                </ul>
                              </AccordionContent>
                            </AccordionItem>
                          </Accordion>
                        </li>
                      );
                    }
                  })
                : sortedNavItems.map(item =>
                    renderNavItem(item, sidebarCollapsed),
                  )}
            </ul>
          </nav>
          {/* Affiliate Section */}
          <div className="px-4 py-2">
            <AffiliateDialog />
          </div>

          {/* User profile */}
          <div className="p-4 border-t border-border flex flex-col gap-2 items-center">
            {/* <UserStreak showText={!sidebarCollapsed} /> */}

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
                      <div className="flex items-center gap-1">
                        <p className="truncate text-xs text-muted-foreground">
                          {user?.email}
                        </p>
                      </div>
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
            <div className="h-full flex flex-col justify-between gap-4">
              <div>
                <Logo withText className="mb-4" />
                <nav className="py-4">
                  <ul className="space-y-2">
                    {groupedSidebarNavItems.sortedMixedItems.map(mixedItem => {
                      if (mixedItem.type === "item") {
                        const item = mixedItem.item;
                        return item.adminOnly && !user?.meta?.isAdmin ? null : (
                          <TooltipProvider key={item.name} delayDuration={0}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <li>
                                  <Link
                                    href={item.disabled ? "" : item.href}
                                    target={item.newTab ? "_blank" : "_self"}
                                    className={cn(
                                      "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                                      isActive(item.href)
                                        ? "text-primary"
                                        : "text-foreground hover:bg-muted",
                                      item.disabled &&
                                        "cursor-not-allowed opacity-50",
                                    )}
                                  >
                                    <item.icon size={20} />
                                    <span>{item.mobileName}</span>
                                    {item.newTab && (
                                      <ExternalLink
                                        size={12}
                                        className="ml-auto"
                                      />
                                    )}
                                  </Link>
                                </li>
                              </TooltipTrigger>
                              <TooltipContent side="right">
                                {item.toolTip || item.name}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        );
                      } else {
                        const { category, items } = mixedItem;
                        const CategoryIcon =
                          categoryIcons[category as keyof typeof categoryIcons];
                        return (
                          <li key={category}>
                            <Accordion
                              type="single"
                              collapsible
                              className="w-full"
                              defaultValue={
                                categorySelected?.toLowerCase() ===
                                category.toLowerCase()
                                  ? category
                                  : undefined
                              }
                            >
                              <AccordionItem
                                value={category}
                                className="border-none"
                              >
                                <AccordionTrigger className="px-3 py-2 text-sm hover:no-underline hover:bg-muted rounded-md">
                                  <div className="flex items-center gap-2">
                                    {CategoryIcon && <CategoryIcon size={16} />}
                                    {category}
                                  </div>
                                </AccordionTrigger>
                                <AccordionContent className="pb-0">
                                  <ul className="space-y-1 ml-4">
                                    {items.map(item =>
                                      item.adminOnly &&
                                      !user?.meta?.isAdmin ? null : (
                                        <TooltipProvider
                                          key={item.name}
                                          delayDuration={0}
                                        >
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <li>
                                                <Link
                                                  href={
                                                    item.disabled
                                                      ? ""
                                                      : item.href
                                                  }
                                                  target={
                                                    item.newTab
                                                      ? "_blank"
                                                      : "_self"
                                                  }
                                                  className={cn(
                                                    "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                                                    isActive(item.href)
                                                      ? "text-primary"
                                                      : "text-foreground hover:bg-muted",
                                                    item.disabled &&
                                                      "cursor-not-allowed opacity-50",
                                                  )}
                                                >
                                                  <item.icon size={20} />
                                                  <span>{item.mobileName}</span>
                                                  {item.newTab && (
                                                    <ExternalLink
                                                      size={12}
                                                      className="ml-auto"
                                                    />
                                                  )}
                                                </Link>
                                              </li>
                                            </TooltipTrigger>
                                            <TooltipContent side="right">
                                              {item.toolTip || item.name}
                                            </TooltipContent>
                                          </Tooltip>
                                        </TooltipProvider>
                                      ),
                                    )}
                                  </ul>
                                </AccordionContent>
                              </AccordionItem>
                            </Accordion>
                          </li>
                        );
                      }
                    })}
                  </ul>
                </nav>
              </div>
              {/* Mobile Affiliate Section */}
              <div className="px-4 py-2">
                <AffiliateDialog />
              </div>
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
                  <div className="flex items-center gap-1">
                    <p className="truncate text-xs text-muted-foreground">
                      {user?.email}
                    </p>
                    {/* <UserStreak /> */}
                  </div>
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
