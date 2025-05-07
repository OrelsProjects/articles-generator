"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import Logo from "@/components/ui/logo";
import { useSession } from "next-auth/react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FlameIcon } from "@/components/ui/flame-icon";

export default function Header() {
  const { data: session, status } = useSession();

  return (
    <header className="w-full flex justify-center bg-background backdrop-blur border-b border-border">
      <div className="container flex items-center justify-between py-4 px-6 md:px-0 md:py-6 xl:px-20 mx-auto">
        <div className="flex gap-6 md:gap-10">
          <Logo textClassName="font-bold text-xl" />
        </div>

        {/* Desktop navigation */}
        <nav className="hidden md:flex justify-center items-center">
          <ul className="flex gap-12">
            {["Pricing", "Features", "FAQ"].map(item => (
              <Button
                variant={"link"}
                asChild
                key={item}
                className="hover:no-underline"
              >
                <li>
                  <Link
                    href={`#${item.toLowerCase()}`}
                    className="font-medium text-foreground transition-colors"
                  >
                    {item}
                  </Link>
                </li>
              </Button>
            ))}
            <li>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant={"ghost"}
                    className="font-medium text-foreground transition-colors"
                  >
                    Free Tools
                    <svg
                      className="ml-1 w-4 h-4 text-muted-foreground"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="bottom" align="start" className="w-72 p-2">
                  <DropdownMenuItem asChild>
                    <Link
                      href="/heat-map"
                      className="flex items-start gap-3 p-2 rounded-md hover:bg-accent transition-colors w-full"
                    >
                      <span className="mt-1">
                        <FlameIcon size={24} className="text-primary" />
                      </span>
                      <span className="flex flex-col text-left">
                        <span className="font-semibold text-sm text-foreground">
                          Heatmap
                        </span>
                        <span className="text-xs text-muted-foreground">
                          See your notes activity and streaks visualized in a
                          heatmap.
                        </span>
                      </span>
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </li>
          </ul>
        </nav>

        <div className="flex items-center gap-4">
          {/* End Free Tools Dropdown */}
          <Button
            size="lg"
            variant="default"
            className={cn(
              "bg-primary hover:bg-primary/90 text-primary-foreground rounded-full",
              {
                "px-3": status === "authenticated",
              },
            )}
            asChild
          >
            {status === "authenticated" ? (
              <Link href="/home">
                <div className="flex items-center gap-2">
                  <Avatar>
                    <AvatarImage
                      src={session?.user?.image || ""}
                      height={10}
                      width={10}
                      className="p-1 rounded-full"
                    />
                    <AvatarFallback>
                      {session?.user?.name?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  Go to app
                </div>
              </Link>
            ) : (
              <Link href="/login">Login</Link>
            )}
          </Button>
        </div>
      </div>
    </header>
  );
}
