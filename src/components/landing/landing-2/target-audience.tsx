import { Users, FileText, Mail } from "lucide-react";
import { motion } from "framer-motion";
import { fadeInUp, staggerChildren, staggerItems } from "../animations";

const audiences = [
  {
    icon: FileText,
    title: "Newsletter Writers",
    description:
      "You want to consistently produce engaging content that resonates with your unique audience",
  },
  {
    icon: Users,
    title: "Digital Creators",
    description:
      "You need to maintain a steady content flow across multiple platforms without sacrificing quality",
  },
  {
    icon: Mail,
    title: "Community Builders",
    description:
      "You're looking to spark meaningful discussions and keep your community actively engaged",
  },
];

export const TargetAudience = () => {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <motion.h2
          className="text-3xl md:text-4xl font-bold text-center mb-16"
          {...fadeInUp}
        >
          You&apos;re going to love this product if:
        </motion.h2>
        <motion.div
          className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto"
          {...staggerChildren}
          transition={{ staggerChildren: 0.2 }}
        >
          {audiences.map(item => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.title}
                variants={staggerItems}
                className="text-center p-6 rounded-2xl bg-background border border-border/40 shadow-sm hover:shadow-md transition-all duration-300"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-4">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
};
