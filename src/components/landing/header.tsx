"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import Logo from "@/components/ui/logo";
import { useSession } from "next-auth/react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

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
              <li key={item}>
                <Link
                  href={`#${item.toLowerCase()}`}
                  className="font-medium text-foreground transition-colors hover:text-primary"
                >
                  {item}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-4">
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
