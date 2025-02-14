import { AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { fadeInUp, staggerChildren, staggerItems } from "../animations";

const antiFeatures = [
  {
    title: "You Love Staring at a Blank Page",
    description:
      "If you enjoy the pain of writer's block and prefer spending hours figuring out what to write, this isn't for you.",
  },
  {
    title: "You Think AI Will Write Everything for You",
    description:
      "This tool helps you think and structure your writing, but it won't replace your voice. If you're looking for a mindless content factory, look elsewhere.",
  },
  {
    title: "You Don't Care About Writing Faster & Smarter",
    description:
      "If you're happy struggling through every article with no direction, no inspiration, and no guidance, you definitely won't need this.",
  },
];

export const AntiAudience = () => {
  return (
    <section className="py-24 bg-gray-50">
      <div className="container mx-auto px-4">
        <motion.div {...fadeInUp}>
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Who This Is Not For
          </h2>
          <p className="text-xl text-gray-600 text-center mb-16">
            You're Going to Hate This Product If:
          </p>
        </motion.div>
        <motion.div 
          className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto"
          {...staggerChildren}
          transition={{ staggerChildren: 0.2 }}
        >
          {antiFeatures.map((feature) => (
            <motion.div
              key={feature.title}
              variants={staggerItems}
              className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm"
            >
              <div className="flex items-center space-x-3 mb-4">
                <AlertCircle className="h-6 w-6 text-red-500" />
                <h3 className="text-lg font-semibold">{feature.title}</h3>
              </div>
              <p className="text-gray-600">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
