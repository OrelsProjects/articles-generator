"use client";

import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fadeIn } from "@/components/landing/animations";
import { motion } from "framer-motion";
import Link from "next/link";

const MotionButton = motion(Button);

export const CTASection = () => (
  <div className="container mx-auto max-w-4xl px-4 text-center">
    <motion.h2
      className="text-3xl md:text-4xl font-bold mb-6"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      variants={fadeIn}
    >
      Ready to overcome writer's block for good?
    </motion.h2>
    <motion.p
      className="text-xl mb-8 opacity-90"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      variants={fadeIn}
    >
      Join thousands of writers who now start and finish articles with ease,
      thanks to AI-generated ideas and outlines.
    </motion.p>
    <MotionButton
      size="lg"
      variant="default"
      className="gap-2"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      variants={fadeIn}
      whileHover={{ scale: 1.05, transition: { duration: 0.3 } }}
      whileTap={{ scale: 0.95 }}
      asChild
    >
      <Link href="/login">
        Start Your Free Trial <ArrowRight className="w-4 h-4" />
      </Link>
    </MotionButton>
    <motion.p
      className="mt-4 text-sm opacity-80"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      variants={fadeIn}
    >
      No credit card required. 14-day free trial.
    </motion.p>
  </div>
);
