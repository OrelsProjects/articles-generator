import FreeSubscriptionProvider from "@/app/providers/FreeSubscriptionProvider";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Pricing",
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <FreeSubscriptionProvider>{children}</FreeSubscriptionProvider>;
}
