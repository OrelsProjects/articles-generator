import { Laptop, Bot, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { fadeInUp, staggerChildren, staggerItems } from "../animations";

const steps = [
  {
    number: "1",
    title: "Enter your substack",
    description: "Drop your Substack URL. No setup, no hassle.",
    icon: Laptop,
  },
  {
    number: "2",
    title: "Our models analyze your blog",
    description: "We study your content, writing style, and tone.",
    icon: Bot,
  },
  {
    number: "3",
    title: "Get article ideas & outlines",
    description:
      "Instantly receive topic ideas and structured outlines based on your writing style.",
    icon: Sparkles,
  },
];

export const HowItWorks = () => {
  return (
    <section className="py-24 bg-white" id="how-it-works">
      <div className="container mx-auto px-4">
        <motion.h2 
          className="text-3xl md:text-4xl font-bold text-center mb-16"
          {...fadeInUp}
        >
          How It Works
        </motion.h2>
        <motion.div 
          className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto"
          {...staggerChildren}
          transition={{ staggerChildren: 0.2 }}
        >
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.number}
                className="relative p-6 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300"
                variants={staggerItems}
              >
                <div className="absolute -top-4 -left-4 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold">
                  {step.number}
                </div>
                <div className="mb-4 text-primary">
                  <Icon className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
};
