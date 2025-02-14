"use client";

import React from "react";
import HeroSection from "@/components/landing/landing-1/hero-sectiont";
import ProcessSection from "@/components/landing/landing-1/process-section";
import CTASection from "@/components/landing/landing-1/cta-section";

const Home = () => {
  return (
    <div className="min-h-screen bg-black">
      <main>
        <HeroSection />
        <ProcessSection />
        <CTASection />
      </main>
    </div>
  );
};

export default Home;
