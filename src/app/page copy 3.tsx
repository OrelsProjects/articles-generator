"use client";

import { HeroSection } from "@/components/landing/landing-2/hero-section";
import { HowItWorks } from "@/components/landing/landing-2/how-it-works";
import { SmartEditor } from "@/components/landing/landing-2/smart-editor";
import { TargetAudience } from "@/components/landing/landing-2/target-audience";
import { AntiAudience } from "@/components/landing/landing-2/anti-audience";
import { SocialProof } from "@/components/landing/landing-2/social-proof";
import { Footer } from "@/components/landing/landing-2/footer";
import { BlankPage } from "@/components/landing/landing-2/blank-page";

const Index = () => {
  return (
    <div className="min-h-screen bg-white">
      <main>
        <BlankPage />
        <HeroSection />
        <HowItWorks />
        <SmartEditor />
        <TargetAudience />
        <AntiAudience />
        <SocialProof />
      </main>
    </div>
  );
};

export default Index;
