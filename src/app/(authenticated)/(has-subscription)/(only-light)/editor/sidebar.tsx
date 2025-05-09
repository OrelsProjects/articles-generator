import { Pencil, Settings, User, LogOut } from "lucide-react";
import Link from "next/link";
import {
  Sidebar,
  SidebarFooter,
  SidebarProvider,
} from "@/components/ui/sidebar";
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
import { selectUi } from "@/lib/features/ui/uiSlice";
import { AnalyzePublicationButton } from "@/components/ui/text-editor/analyze-publication-button";
import { selectPublications } from "@/lib/features/publications/publicationSlice";

export function AppSidebar({ children }: { children: React.ReactNode }) {
  const { signOut } = useAuth();
  const { state } = useAppSelector(selectUi);
  const { user, loading } = useAppSelector(selectAuth);

  const handleLogout = () => {
    signOut();
  };

  return (
    <SidebarProvider open={state === "full"}>
      <Sidebar className="w-16">
        <SidebarFooter>
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
                    className="flex w-full items-center gap-3 rounded-md text-left text-sm py-8 hover:bg-sidebar-accent"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.image || ""} alt="User" />
                      <AvatarFallback>
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-[200px]"
                  side="right"
                  sideOffset={8}
                >
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      <span>Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      <span>Usage</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <AnalyzePublicationButton />
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
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
