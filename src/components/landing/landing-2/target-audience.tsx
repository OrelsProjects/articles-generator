import { Users, FileText, Mail } from "lucide-react";
import { motion } from "framer-motion";
import { fadeInUp, staggerChildren, staggerItems } from "../animations";

const audiences = [
  {
    icon: FileText,
    title: "Substack Writers",
    description: "Generate fresh ideas that match your tone",
  },
  {
    icon: Users,
    title: "Content Creators",
    description: "Write better, faster, with AI-powered help",
  },
  {
    icon: Mail,
    title: "Newsletter Owners",
    description: "Keep your readers engaged with high-quality content",
  },
];

export const TargetAudience = () => {
  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-4">
        <motion.h2 
          className="text-3xl md:text-4xl font-bold text-center mb-16"
          {...fadeInUp}
        >
          Who This Is For
        </motion.h2>
        <motion.div 
          className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto"
          {...staggerChildren}
          transition={{ staggerChildren: 0.2 }}
        >
          {audiences.map((item) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.title}
                variants={staggerItems}
                className="text-center p-6 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-4">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.description}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
};
