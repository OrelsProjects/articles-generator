import { useMemo, useState } from "react";
import { Plan } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { getPlanName } from "@/lib/plans-consts";
import useLocalStorage from "@/lib/hooks/useLocalStorage";
import { useAppSelector } from "@/lib/hooks/redux";

export interface PremiumFeatureSoonProps {
  planRequired: Plan;
  children: React.ReactNode;
  className?: string;
  overlayClassName?: string;
}

export default function PremiumFeatureSoonOverlay({
  planRequired,
  className,
  children,
  overlayClassName,
}: PremiumFeatureSoonProps) {
  const { user } = useAppSelector(state => state.auth);

  const userPlan = user?.meta?.plan;

  const [showOverlay, setShowOverlay] = useLocalStorage<boolean>(
    "premium-feature-soon-overlay",
    true,
  );

  const updateShowOverlay = (show: boolean) => {
    setShowOverlay(show);
  };

  const hasPlanRequired = useMemo(() => {
    if (userPlan === "premium") return true;
    if (userPlan === "standard") {
      if (planRequired === "premium") return false;
      return true;
    }
    return planRequired === "hobbyist";
  }, [planRequired, userPlan]);

  const planName = getPlanName(planRequired);

  return children;
    // <div
    //   className={cn(
    //     "w-full h-fit relative flex flex-col items-center justify-center",
    //     className,
    //   )}
    // >
    //   <AnimatePresence>
    //     {showOverlay && hasPlanRequired && (
    //       <motion.div
    //         initial={{ opacity: 0 }}
    //         animate={{ opacity: 1 }}
    //         exit={{ opacity: 0 }}
    //         transition={{ duration: 0.6 }}
    //         className={cn(
    //           "absolute top-0 left-0 w-full h-full bg-black/50 backdrop-blur-sm z-10 flex flex-col items-center justify-center",
    //           overlayClassName,
    //         )}
    //       >
    //         <h1 className="text-2xl font-bold text-white text-center">
    //           This feature will be for {planName} users soon.
    //         </h1>
    //         <p className="text-sm text-white/80 text-center mt-2">
    //           Hey there! This is a heads-up that this feature will be available
    //           to {planName} users soon.
    //           <br />
    //           You can upgrade to {planName} now and keep your access.
    //         </p>
    //         <Button variant={"neumorphic-primary"} className="mt-8" asChild>
    //           <Link href="/settings/pricing">Upgrade to {planName}</Link>
    //         </Button>
    //         <Button
    //           className="mt-2 text-white/80"
    //           variant="link"
    //           onClick={() => updateShowOverlay(false)}
    //         >
    //           I don&apos;t need this feature
    //         </Button>
    //       </motion.div>
    //     )}
    //   </AnimatePresence>
    //   {children}
    // </div>
//  );
}
