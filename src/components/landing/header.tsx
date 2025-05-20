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
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {

  BrainCircuit,
  Flame,
  Menu,
  UsersIcon,
} from "lucide-react";
import { rootPath } from "@/types/navbar";

const freeTools = [
  {
    Icon: () => <Flame size={24} className="text-primary" />,
    name: "Heatmap",
    href: "/heatmap",
    title: "Heatmap",
    description:
      "See your notes activity and streaks visualized in a GitHub-style heatmap.",
    adminOnly: false,
  },
  {
    Icon: () => <UsersIcon size={24} className="text-primary" />,
    name: "Find your fans",
    href: "/fans",
    title: "Find your fans",
    description: "Find out who are your top readers.",
    adminOnly: false,
  },
  {
    Icon: () => <BrainCircuit size={24} className="text-primary" />,
    name: "Article Teaser Generator",
    href: "/note-generator/post",
    title: "Article Teaser Generator",
    description: "Generate a teaser for your article.",
    adminOnly: false,
  },
];

export default function Header() {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);

  const isAdmin = session?.user?.meta?.isAdmin;

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
                <DropdownMenuContent
                  side="bottom"
                  align="start"
                  className="max-w-md p-2 grid grid-cols-2 gap-2"
                >
                  {freeTools.map(tool =>
                    tool.adminOnly && !isAdmin ? null : (
                      <DropdownMenuItem asChild key={tool.href}>
                        <Link
                          href={tool.href}
                          className="flex items-start gap-3 p-2 rounded-md hover:bg-accent transition-colors w-full"
                        >
                          <span className="mt-1">
                            <tool.Icon />
                          </span>
                          <span className="flex flex-col text-left">
                            <span className="font-semibold text-sm text-foreground">
                              {tool.title}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {tool.description}
                            </span>
                          </span>
                        </Link>
                      </DropdownMenuItem>
                    ),
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </li>
          </ul>
        </nav>

        <div className="flex items-center gap-4">
          {/* Login/Go to app button - visible on desktop, hidden on mobile */}
          <Button
            size="lg"
            variant="default"
            className={cn(
              "bg-primary hover:bg-primary/90 text-primary-foreground hidden md:flex",
              {
                "px-0 rounded-full md:px-3": status === "authenticated",
              },
            )}
            asChild
          >
            {status === "authenticated" ? (
              <Link href={rootPath}>
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
                  <span className="text-sm">Go to app</span>
                </div>
              </Link>
            ) : (
              <Link href="/login">Login</Link>
            )}
          </Button>
        </div>
        {/* Mobile sidebar */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72">
            <nav className="flex flex-col mt-10">
              <ul className="space-y-4">
                {["Pricing", "Features", "FAQ"].map(item => (
                  <li key={item}>
                    <Link
                      href={`#${item.toLowerCase()}`}
                      className="font-medium text-foreground transition-colors block py-2"
                      onClick={() => setOpen(false)}
                    >
                      {item}
                    </Link>
                  </li>
                ))}
                <li className="pt-2">
                  <div className="font-medium text-foreground">Free Tools</div>
                  <ul className="pl-4 mt-2">
                    {freeTools.map(tool => (
                      <li key={tool.href}>
                        <Link
                          href={tool.href}
                          className="flex items-start gap-3 p-2 rounded-md hover:bg-accent transition-colors"
                          onClick={() => setOpen(false)}
                        >
                          <span className="mt-1">
                            <tool.Icon />
                          </span>
                          <span className="flex flex-col text-left">
                            <span className="font-semibold text-sm text-foreground">
                              {tool.title}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {tool.description}
                            </span>
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </li>

                {/* Login/Go to app button in mobile sidebar */}
                <li className="pt-6">
                  <Button
                    size="lg"
                    variant="default"
                    className={cn(
                      "bg-primary hover:bg-primary/90 text-primary-foreground w-full",
                      {
                        "rounded-full": status === "authenticated",
                      },
                    )}
                    asChild
                    onClick={() => setOpen(false)}
                  >
                    {status === "authenticated" ? (
                      <Link href={rootPath}>
                        <div className="flex items-center gap-2 justify-center">
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
                          <span>Go to app</span>
                        </div>
                      </Link>
                    ) : (
                      <Link href="/login">Login</Link>
                    )}
                  </Button>
                </li>
              </ul>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
