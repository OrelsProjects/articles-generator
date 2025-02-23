import Link from "next/link";
import { Button } from "@/components/ui/button";
import Logo from "@/components/ui/logo";
export default function Header() {
  return (
    <header className="absolute top-0 z-50 w-full flex justify-center bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex items-center justify-between px-8 md:px-28 py-4 md:py-6 mx-auto">
        <div className="flex gap-6 md:gap-10">
          <Logo textClassName="font-bold text-xl" />
        </div>

        {/* Desktop navigation */}
        <nav className="hidden md:flex justify-center items-center">
          <ul className="flex gap-12">
            {["Pricing", "Reviews", "Features", "Platforms", "FAQ"].map(
              item => (
                <li key={item}>
                  <Link
                    href={`#${item.toLowerCase()}`}
                    className="font-medium text-foreground transition-colors hover:text-primary"
                  >
                    {item}
                  </Link>
                </li>
              ),
            )}
          </ul>
        </nav>

        {/* Mobile navigation button */}
        <Button
          aria-label="Toggle menu"
          variant="outline"
          className="inline-flex items-center justify-center rounded-md p-2.5 text-muted-foreground md:hidden"
        >
          <svg
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </Button>

        <Button
          size="lg"
          variant="default"
          className="bg-primary hover:bg-primary/90 text-white"
          asChild
        >
          <Link href="/login">Login</Link>
        </Button>
      </div>
    </header>
  );
}
