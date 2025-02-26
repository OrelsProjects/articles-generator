import { useAppSelector } from "@/lib/hooks/redux";
import { cn } from "@/lib/utils";
import { useMemo } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@radix-ui/react-avatar";
import { User, LogOut, ChevronDown } from "lucide-react";
import useAuth from "@/lib/hooks/useAuth";
import { selectAuth } from "@/lib/features/auth/authSlice";
import { Button } from "@/components/ui/button";
import { SettingsDialog } from "@/components/settings/settings";
import { useSettings } from "@/lib/hooks/useSettings";
import { useCustomRouter } from "@/lib/hooks/useCustomRouter";

export function Header({ className }: { className?: string }) {
  const router = useCustomRouter();
  const { signOut } = useAuth();
  const { hasPublication } = useSettings();
  const { user } = useAppSelector(selectAuth);
  const { publications } = useAppSelector(state => state.publications);

  const publication = useMemo(() => {
    return publications[0];
  }, [publications]);

  const handleLogout = () => {
    signOut();
  };

  const Dropdown = ({ className }: { className?: string }) => (
    <div className={cn("h-full flex items-center ml-auto", className)}>
      <DropdownMenu>
        <DropdownMenuTrigger>
          <Avatar className="relative flex items-center justify-center">
            <Button
              className="p-1 w-fit h-fit rounded-full relative hover:cursor-pointer"
              variant="ghost"
              size="icon"
            >
              <AvatarImage
                src={user?.image || ""}
                alt="User"
                className="h-10 w-10 rounded-full border-2 border-gray-300"
              />
            </Button>
            <AvatarFallback>
              <div className="bg-muted-foreground/20 rounded-full p-2">
                <User className="h-6 w-6 rounded-full" />
              </div>
            </AvatarFallback>
            <div className="absolute bottom-0.5 right-0.5 bg-muted rounded-full w-4 h-4 flex items-center justify-center border-2 border-white">
              <ChevronDown className="w-3 h-3" />
            </div>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="ml-4">
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
        "w-full grid grid-cols-[auto_1fr_auto] items-center gap-4 bg-background px-4 border-b border-border py-1 z-10",
        className,
      )}
    >
      <div className="flex items-center justify-start">
        {publication?.image && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (publication.url) router.push(publication.url);
            }}
            className="rounded-md"
          >
            <Image
              src={publication.image}
              alt={publication.title || ""}
              width={36}
              height={36}
              className="rounded-md"
            />
          </Button>
        )}
      </div>
      <h1 className="text-2xl font-bold text-center">{publication?.title}</h1>
      <Dropdown />
    </motion.header>
  );
}
