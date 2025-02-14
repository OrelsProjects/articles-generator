import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";

export const HeroSection = () => {
  const [substackUrl, setSubstackUrl] = useState("");

  return (
    <section className="min-h-screen flex flex-col items-center justify-center px-4 py-16 bg-gradient-to-b from-white to-gray-50">
      <motion.div
        className="max-w-4xl mx-auto text-center space-y-8"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      >
        <motion.h1
          className="text-4xl md:text-6xl font-bold tracking-tight text-gray-900 mb-6"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.2 }}
        >
          Never stare at a blank page again
        </motion.h1>

        <motion.p
          className="text-xl md:text-2xl text-gray-600 max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.4 }}
        >
          Turn your Substack into an idea machine. Get personalized article
          ideas and structured outlines tailored to your writing style—so you
          can start writing faster.
        </motion.p>

        <motion.div
          className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-md mx-auto mt-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.6 }}
        >
          <Input
            type="url"
            placeholder="Enter your Substack URL"
            className="text-lg h-12"
            value={substackUrl}
            onChange={e => setSubstackUrl(e.target.value)}
          />
          <Button
            size="lg"
            className="bg-primary hover:bg-primary-hover text-white font-semibold px-8 h-12 transition-all duration-200 ease-in-out transform hover:scale-105"
          >
            Try It Now
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </motion.div>
      </motion.div>
    </section>
  );
};
