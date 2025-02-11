import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Code, Database, Sparkles } from "lucide-react";

interface HeroSectionProps {
  headline?: string;
  subheadline?: string;
  ctaText?: string;
  onCtaClick?: () => void;
}

const HeroSection = ({
  headline = "AI-Powered Article Ideas That Sound Like You",
  subheadline = "Break through writer's block with personalized content ideas based on your writing style and top performers in your niche",
  ctaText = "Start Generating Ideas",
  onCtaClick = () => console.log("CTA clicked"),
}: HeroSectionProps) => {
  return (
    <div className="min-h-[600px] w-full bg-black text-white relative overflow-hidden">
      {/* Background gradient effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-blue-900/20" />

      {/* Main content container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 relative z-10">
        <div className="text-center space-y-8">
          {/* Animated headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight"
          >
            {headline}
          </motion.h1>

          {/* Animated subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl sm:text-2xl text-gray-300 max-w-3xl mx-auto"
          >
            {subheadline}
          </motion.p>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Button
              size="lg"
              onClick={onCtaClick}
              className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-6 text-lg rounded-full"
            >
              {ctaText}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </motion.div>

          {/* Animated features icons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="flex justify-center gap-8 mt-12"
          >
            <div className="flex items-center gap-2 text-blue-400">
              <Sparkles className="h-6 w-6" />
              <span>AI-Powered</span>
            </div>
            <div className="flex items-center gap-2 text-purple-400">
              <Database className="h-6 w-6" />
              <span>Milvus DB</span>
            </div>
            <div className="flex items-center gap-2 text-green-400">
              <Code className="h-6 w-6" />
              <span>Smart Analytics</span>
            </div>
          </motion.div>
        </div>

        {/* Animated vector graphic representation */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="mt-16 flex justify-center"
        >
          <div className="relative w-full max-w-4xl h-64 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-2xl overflow-hidden">
            {/* Animated data flow visualization */}
            <motion.div
              animate={{
                x: [0, 100, 0],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "linear",
              }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default HeroSection;
