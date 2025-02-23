import Link from "next/link";
import { Button } from "@/components/ui/button";
import Logo from "@/components/ui/logo";
export default function Header() {
  return (
    <header className="absolute top-0 z-50 w-full flex justify-center bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex items-center justify-between py-4 px-6 md:px-0 md:py-6 xl:px-20 mx-auto">
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
