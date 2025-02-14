import React, { useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { motion } from "framer-motion";
import { fadeInUp, staggerChildren, staggerItems } from "../animations";

function PricingCard({
  title,
  monthlyPrice,
  description,
  features,
  ctaText,
  isPopular,
  annualDiscount = 0.3,
  isAnnual,
}: {
  title: string;
  monthlyPrice: number;
  description: string;
  features: string[];
  ctaText: string;
  isPopular?: boolean;
  annualDiscount?: number;
  isAnnual: boolean;
}) {
  const price = isAnnual
    ? (monthlyPrice * (1 - annualDiscount)).toFixed(0)
    : monthlyPrice;

  return (
    <div
      className={`relative bg-card text-card-foreground rounded-xl p-8 shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${isPopular ? "border-2 border-primary" : "border border-border"}`}
    >
      {isPopular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
          Most Popular
        </div>
      )}
      <h3 className="text-2xl font-bold mb-2">{title}</h3>
      <div className="mb-4">
        <span className="text-4xl font-bold">${price}</span>
        <span className="text-muted-foreground">/month</span>
      </div>
      <p className="text-muted-foreground mb-6">{description}</p>
      <div className="space-y-4 mb-8">
        {features.map((feature, index) => (
          <div key={index} className="flex items-start gap-3">
            <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <span className="text-card-foreground">{feature}</span>
          </div>
        ))}
      </div>
      <Button
        variant={isPopular ? "default" : "outline"}
        className="w-full py-3 px-6 rounded-lg font-semibold transition-all duration-300"
      >
        {ctaText}
      </Button>
    </div>
  );
}

function Pricing() {
  const [isAnnual, setIsAnnual] = useState(true);

  return (
    <div className="relative min-h-screen py-20 pb-8 px-4">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
      <div className="max-w-6xl mx-auto">
        <motion.div
          className="text-center mb-16"
          {...fadeInUp}
          transition={{ duration: 0.7 }}
        >
          <h1 className="text-4xl font-bold mb-4 text-foreground">
            Simple, No-Nonsense Pricing 💰
          </h1>
          <h2 className="text-xl text-muted-foreground mb-4">
            Pick Your Plan & Start Writing Smarter
          </h2>
          <p className="text-muted-foreground">
            💡 No hidden fees. No contracts. Just a tool that helps you write
            faster.
          </p>
        </motion.div>

        <motion.div
          className="flex items-center justify-center gap-4 mb-8"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          viewport={{ once: true }}
        >
          <span className="text-muted-foreground">Monthly</span>
          <Switch checked={isAnnual} onCheckedChange={setIsAnnual} />
          <span className="text-muted-foreground">Annual - Save 30%</span>
        </motion.div>

        <motion.div
          className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto"
          {...staggerChildren}
          transition={{ staggerChildren: 0.2 }}
        >
          {[
            <PricingCard
              key="free"
              title="Free Plan"
              monthlyPrice={0}
              description="For the curious writer who wants a taste."
              features={[
                "Analyze up to 3 Substack posts",
                "Generate 3 article ideas + outlines per month",
                "Basic AI writing assistance",
              ]}
              ctaText="Get Started for Free"
              isAnnual={isAnnual}
            />,
            <PricingCard
              key="pro"
              title="Pro Plan"
              monthlyPrice={19}
              description="For serious writers & content creators."
              features={[
                "Unlimited Substack analysis",
                "Unlimited article ideas + outlines",
                "Full AI-powered editor with advanced suggestions",
                "Up to 3 publications under one account",
                "Priority support",
              ]}
              ctaText="Start Writing Smarter"
              isPopular
              isAnnual={isAnnual}
            />,
          ].map(card => (
            <motion.div
              key={card.key}
              variants={staggerItems}
              transition={{ duration: 0.5 }}
            >
              {card}
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          className="text-center mt-16 space-y-6"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.7 }}
          viewport={{ once: true }}
        >
          <p className="text-lg font-semibold text-card-foreground">
            ⚡ No Risk. No Commitment. Cancel Anytime.
          </p>
          <button className="bg-primary text-primary-foreground px-8 py-4 rounded-lg font-semibold hover:bg-primary/90 transition-colors duration-300 shadow-lg hover:shadow-primary/20">
            👉 Try It Now – Enter Your Substack 🚀
          </button>
        </motion.div>
      </div>
    </div>
  );
}

export default Pricing;
