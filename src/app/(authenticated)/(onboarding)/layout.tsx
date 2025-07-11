import { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: {
    default: "Onboarding",
    template: "%s | Onboarding",
  },
  description: "Onboarding",
};

export default function HeatmapLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="absolute inset-0 bg-foreground/70 dark:bg-background/50 backdrop-blur-sm z-20" />
      <Image
        src="/home-dark.png"
        alt="Home"
        fill
        className="absolute inset-0 object-fill hidden dark:block z-10"
      />
      <Image
        src="/home-light.png"
        alt="Home"
        fill
        className="absolute inset-0 object-fill block dark:hidden z-10"
      />
      <div className="relative z-30">{children}</div>
    </>
  );
}
