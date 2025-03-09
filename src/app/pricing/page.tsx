"use client";

import Pricing from "@/components/landing/pricing-section";
import { useSearchParams } from "next/navigation";
export default function PricingPage() {
  return (
    <div className="min-h-screen">
      <Pricing onboarding />
    </div>
  );
}
