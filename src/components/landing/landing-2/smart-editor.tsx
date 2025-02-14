import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { fadeIn, fadeInUp, staggerChildren, staggerItems } from "../animations";

const features = [
  "Guided Outlines – Start strong with structured content frameworks",
  "AI Suggestions – Stuck? Our AI helps refine your writing in real time",
  "Minimal, Distraction-Free Editor – Stay in flow and write without clutter",
];

export const SmartEditor = () => {
  return (
    <section className="py-24 bg-gray-50">
      <div className="container mx-auto px-4">
        <motion.div
          className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center"
          {...staggerChildren}
          transition={{ staggerChildren: 0.2 }}
        >
          <motion.div className="space-y-6" variants={staggerItems}>
            <h2 className="text-3xl md:text-4xl font-bold">
              AI-Powered Writing Assistant
            </h2>
            <motion.div
              className="space-y-4"
              variants={fadeIn}
              {...staggerChildren}
              transition={{ staggerChildren: 0.1 }}
            >
              {features.map(feature => (
                <motion.div
                  key={feature}
                  variants={staggerItems}
                  className="flex items-start space-x-3"
                >
                  <div className="flex-shrink-0">
                    <Check className="h-6 w-6 text-primary" />
                  </div>
                  <p className="text-gray-600 text-lg">{feature}</p>
                </motion.div>
              ))}
            </motion.div>
            <Button
              size="lg"
              className="bg-primary hover:bg-primary-hover text-white font-semibold px-8"
            >
              Try the Editor
            </Button>
          </motion.div>
          <motion.div
            className="relative rounded-2xl overflow-hidden shadow-2xl"
            variants={staggerItems}
          >
            <div className="aspect-w-16 aspect-h-9 bg-gray-900 p-4">
              <div className="bg-gray-800 rounded-lg p-4 h-full">
                <div className="animate-pulse h-4 bg-gray-700 rounded w-3/4 mb-4"></div>
                <div className="animate-pulse h-4 bg-gray-700 rounded w-1/2 mb-4"></div>
                <div className="animate-pulse h-4 bg-gray-700 rounded w-5/6"></div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};
