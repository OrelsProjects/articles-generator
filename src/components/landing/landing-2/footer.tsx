"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-4 z-50">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between max-w-5xl mx-auto">
          <div className="text-center md:text-left mb-4 md:mb-0">
            <h3 className="text-xl font-semibold">
              Turn Your Substack into a Content Machine
            </h3>
            <p className="text-gray-600">
              Get instant article ideas and AI-powered writing assistance.
            </p>
          </div>
          <Button
            size="lg"
            className="bg-primary hover:bg-primary-hover text-white font-semibold px-8"
          >
            Try It Now
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>
    </footer>
  );
};
