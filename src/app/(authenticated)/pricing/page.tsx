"use client";

import Pricing from "@/components/landing/pricing-section";
import { Button } from "@/components/ui/button";
import Logo from "@/components/ui/logo";
import { useCustomRouter } from "@/lib/hooks/useCustomRouter";
import usePayments from "@/lib/hooks/usePayments";
import { rootPath } from "@/types/navbar";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function PricingPage() {
  const router = useCustomRouter();
  const { verifySubscription } = usePayments();
  const searchParams = useSearchParams();
  const code = searchParams.get("code");

  useEffect(() => {
    verifySubscription()
      .then(() => {
        router.push(rootPath);
      })
      .catch(() => {
        // Do nothing
      });
  }, []);

  return (
    <div className="min-h-screen relative">
      {/* <header className="sticky top-0 z-50 h-16">
        <div className="max-w-7xl mx-auto px-8 py-4 rounded-full pt-4 shadow-md">
          <div className="flex items-center justify-between bg-background/60 backdrop-blur-sm">
            <Logo />
            <Button variant="ghost" size="icon" className="w-fit px-2" asChild>
              <Link href={rootPath}>
                Have an account?
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header> */}
      <Pricing onboarding code={code} />
    </div>
  );
}
