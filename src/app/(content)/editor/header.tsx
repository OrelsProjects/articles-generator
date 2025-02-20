import { useAppSelector } from "@/lib/hooks/redux";
import { cn } from "@/lib/utils";
import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@radix-ui/react-avatar";
import { User, LogOut, Settings, ChevronDown } from "lucide-react";
import useAuth from "@/lib/hooks/useAuth";
import { selectAuth } from "@/lib/features/auth/authSlice";
import { Button } from "@/components/ui/button";
import { SettingsDialog } from "@/components/settings/settings";
import { AnalyzePublicationButton } from "@/components/ui/text-editor/analyze-publication-button";

export function Header({ className }: { className?: string }) {
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

  const hasPublication = useMemo(() => {
    return publications.length > 0;
  }, [publications]);

  const Dropdown = ({ className }: { className?: string }) => (
    <div className={cn("h-full flex items-center ml-auto", className)}>
      <DropdownMenu>
        <DropdownMenuTrigger>
          <Avatar>
            <Button
              className="p-1 w-fit h-fit rounded-full relative"
              variant="ghost"
              size="icon"
            >
              <AvatarImage
                src={user?.image || ""}
                alt="User"
                className="h-10 w-10 rounded-full border-2 border-gray-300"
              />
              <div className="absolute bottom-0.5 right-0.5 bg-muted rounded-full w-4 h-4 flex items-center justify-center border-2 border-white">
                <ChevronDown className="w-3 h-3" />
              </div>
            </Button>
            <AvatarFallback>
              <div className="bg-muted-foreground/20 rounded-full p-2">
                <User className="h-6 w-6 rounded-full" />
              </div>
            </AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="ml-4">
          {!hasPublication && (
            <DropdownMenuItem asChild>
              <AnalyzePublicationButton variant="ghost" className="pl-2" />
            </DropdownMenuItem>
          )}
          {!hasPublication && <DropdownMenuSeparator />}
          <DropdownMenuItem asChild>
            <SettingsDialog />
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
    </div>
  );

  return (
    <motion.header
      key={`header`}
      initial={{ opacity: 0, y: 0 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={cn(
        "w-full grid grid-cols-[1fr_auto_1fr] items-center gap-4 bg-background px-4 border-b border-border py-1 z-10",
        className,
      )}
    >
      {publication?.image && (
        <Image
          src={publication.image}
          alt={publication.title || ""}
          width={36}
          height={36}
          className="rounded-md col-span-1"
        />
      )}
      <h1 className="text-2xl font-bold col-span-">{publication?.title}</h1>
      <Dropdown className="col-span-1" />
    </motion.header>
  );
}
