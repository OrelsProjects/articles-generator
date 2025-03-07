"use client";

import Pricing from "@/components/landing/pricing-section";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <header className="w-full flex items-center gap-4 bg-background px-4 border-b border-border py-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/editor">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-xl font-semibold">Pricing</h1>
      </header>
      <Pricing />;
    </div>
  );
}
