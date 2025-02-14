import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { motion } from "framer-motion";
import { fadeInUp } from "../animations";

const testimonials = [
  {
    quote:
      "This tool completely changed my writing flow. I go from idea to draft in minutes instead of hours.",
    author: "Sarah Johnson",
    role: "Tech Writer",
  },
  {
    quote:
      "The AI suggestions are spot-on and help me maintain my unique voice while writing faster.",
    author: "Michael Chen",
    role: "Newsletter Creator",
  },
  {
    quote:
      "Finally, a tool that understands what Substack writers actually need. Game changer!",
    author: "Emma Williams",
    role: "Substack Writer",
  },
];

export const SocialProof = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % testimonials.length);
  };

  const prevSlide = () => {
    setCurrentSlide(
      (prev) => (prev - 1 + testimonials.length) % testimonials.length
    );
  };

  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-4">
        <motion.div 
          className="max-w-4xl mx-auto relative"
          {...fadeInUp}
          transition={{ duration: 0.7 }}
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">What Writers Say</h2>
          </div>
          <div className="relative overflow-hidden rounded-2xl bg-gray-50 p-8 md:p-12">
            <Quote className="absolute top-4 left-4 h-12 w-12 text-primary opacity-20" />
            <div className="relative z-10">
              <blockquote className="text-xl md:text-2xl text-gray-900 mb-6">
                {testimonials[currentSlide].quote}
              </blockquote>
              <div className="flex flex-col items-center">
                <cite className="font-semibold text-gray-900 not-italic">
                  {testimonials[currentSlide].author}
                </cite>
                <span className="text-gray-600">
                  {testimonials[currentSlide].role}
                </span>
              </div>
            </div>
          </div>
          <div className="flex justify-center mt-8 space-x-4">
            <Button
              variant="outline"
              size="icon"
              onClick={prevSlide}
              className="rounded-full"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={nextSlide}
              className="rounded-full"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
