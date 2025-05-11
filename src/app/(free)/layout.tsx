import { ThemeProvider } from "@/app/providers/ThemeProvider";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Logo from "@/components/ui/logo";
import { ArrowRight } from "lucide-react";
import { appName } from "@/lib/consts";

export default function FreeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="w-full flex justify-center bg-background backdrop-blur border-b border-border">
        <div className="container flex items-center justify-between py-4 px-6 md:px-0 md:py-6 xl:px-20 mx-auto">
          <div className="flex gap-6 md:gap-10">
            <Link href="/">
              <Logo textClassName="font-bold text-xl" />
            </Link>
          </div>

          {/* Desktop navigation */}
          <div className="flex items-center gap-4">
            <Button
              size="lg"
              variant="default"
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
              asChild
            >
              <Link href="/">
                <span className="hidden md:flex">Start growing now</span>
                <span className="flex md:hidden">Start now</span>
                <ArrowRight className="ml-2" size={16} strokeWidth={1.5} />
              </Link>
            </Button>
          </div>
        </div>
      </header>
      
      {/* Main content */}
      <main className="flex-grow">
        <ThemeProvider>{children}</ThemeProvider>
      </main>
      
      {/* Footer */}
      <footer className="bg-muted py-6 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} {appName}. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            This website is not affiliated or partnered with Substack.
          </p>
        </div>
      </footer>
    </div>
  );
}
