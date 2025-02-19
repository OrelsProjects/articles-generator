import { useAppSelector } from "@/lib/hooks/redux";
import { cn } from "@/lib/utils";
import { useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { selectUi } from "@/lib/features/ui/uiSlice";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@radix-ui/react-avatar";
import { User, LogOut } from "lucide-react";
import useAuth from "@/lib/hooks/useAuth";
import { selectAuth } from "@/lib/features/auth/authSlice";
import { Button } from "@/components/ui/button";
import { sendMail } from "@/lib/mail/mail";
import { welcomeTemplate } from "@/lib/mail/templates";

export function Header({ className }: { className?: string }) {
  const { state } = useAppSelector(selectUi);
  const { user } = useAppSelector(selectAuth);
  const { signOut } = useAuth();
  const { publications } = useAppSelector(state => state.publications);

  const publication = useMemo(() => {
    return publications[0];
  }, [publications]);

  const handleLogout = () => {
    signOut();
  };

  const userPlan = useMemo(() => {
    const plan = user?.meta?.plan || "free";
    if (plan === "free") {
      return "free";
    }
    if (plan === "pro") {
      return "Write+";
    }
    if (plan === "superPro") {
      return "Write+ (annual)";
    }
    return "free";
  }, [user]);

  const test = async () => {
    await fetch("/api/test");
  };

  // if (!publication) return null;

  return (
    <AnimatePresence mode="popLayout">
      {/* {state === "full" && ( */}
      <motion.header
        key={`header`}
        initial={{ opacity: 0, y: 0 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={cn(
          "w-full flex items-center justify-center gap-4 bg-background px-4 border-b border-border py-1 z-10",
          className,
        )}
      >
        <Link href="/editor" className="flex items-center gap-4">
          {publication?.image && (
            <Image
              src={publication.image}
              alt={publication.title || ""}
              width={34}
              height={34}
              className="rounded-md"
            />
          )}
          <h1 className="text-xl font-bold">{publication?.title}</h1>
        </Link>
        <div className="h-full flex items-center ml-auto">
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Avatar>
                <Button
                  className="p-1 w-fit h-fit rounded-full !ring-0"
                  variant="ghost"
                  size="icon"
                >
                  <AvatarImage
                    src={user?.image || ""}
                    alt="User"
                    className="h-10 w-10 rounded-full"
                  />
                </Button>
                <AvatarFallback>
                  <div className="bg-muted-foreground/20 rounded-full p-2">
                    <User className="h-6 w-6 rounded-full" />
                  </div>
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="ml-4">
              <DropdownMenuItem>
                <p
                  className={cn("text-sm text-muted-foreground", {
                    "text-primary": userPlan !== "free",
                  })}
                >
                  {`${userPlan}` || "free"}
                </p>
              </DropdownMenuItem>
              <DropdownMenuSeparator />

              {/* <DropdownMenuItem asChild>
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
              */}
              <DropdownMenuItem
                className="text-destructive focus:text-destructive flex items-center gap-2"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </motion.header>
      {/* )} */}
    </AnimatePresence>
  );
}
