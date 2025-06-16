"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Coins, ExternalLink } from "lucide-react";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { useTheme } from "next-themes";
import { useAppSelector } from "@/lib/hooks/redux";
import { selectUi } from "@/lib/features/ui/uiSlice";
import { cn } from "@/lib/utils";

interface AffiliateDialogProps {
  children: React.ReactNode;
}

export function AffiliateDialog({ children }: AffiliateDialogProps) {
  const { sideBarState } = useAppSelector(selectUi);

  const handleAffiliateClick = () => {
    window.open("https://writestack-app.getrewardful.com", "_blank");
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <div className="relative h-full rounded-lg">
          <GlowingEffect
            spread={40}
            glow={true}
            disabled={false}
            proximity={64}
            inactiveZone={0.01}
          />
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "w-full flex items-center gap-2 hover:border-input dark:hover:border-input border-yellow-500 dark:border-yellow-700  shadow-md",
              "transition-all duration-300 hover:bg-transparent",
              {
                "p-0": sideBarState === "collapsed",
              },
            )}
          >
            <Coins className="h-4 w-4 text-yellow-500" />
            <span
              className={cn("text-sm", {
                hidden: sideBarState === "collapsed",
              })}
            >
              Affiliate WriteStack
            </span>
          </Button>
        </div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-yellow-500" />
            Affiliate WriteStack
          </DialogTitle>
          <DialogDescription className="text-left space-y-3 pt-2">
            <p>
              Join our affiliate program and earn money by referring new users
              to WriteStack!
            </p>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <p className="font-semibold text-yellow-800 dark:text-yellow-200">
                🎉 Earn 30% commission for life!
              </p>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                Get paid for every user you refer, with recurring commissions as
                long as they remain subscribed.
              </p>
            </div>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• Easy-to-use affiliate dashboard</li>
              <li>• Real-time tracking and analytics</li>
              <li>• Monthly payouts via PayPal or bank transfer</li>
            </ul>
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end space-x-2 pt-4">
          <Button
            variant={"neumorphic-primary"}
            onClick={handleAffiliateClick}
            className="flex items-center gap-2"
          >
            Get Started
            <ExternalLink size={16} />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
