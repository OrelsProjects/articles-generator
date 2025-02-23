import React, { useEffect, useRef } from "react";
import { Brain, Pen, Fingerprint, Database, Layout } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const features = [
  {
    title: "Idea generation & outlines",
    description:
      "Never stare at a blank page again. Get unique ideas, customized titles and outlines suggestions drawn from millions of the <strong>best</strong> articles.",
    icon: Brain,
    imageUrl: "/landing/generated-ideas.png",
  },
  {
    title: "Real-Time AI assistance",
    description:
      "Refine your tone, improve readability, and spot overlooked details without losing your signature style.",
    icon: Pen,
    imageUrl: "/landing/ai-assistance.png",
  },
  {
    title: "Research at your fingertips",
    description:
      "Pull in relevant data and insights from top articles to keep your content informed and up-to-date.",
    icon: Database,
    imageUrl: "/landing/top-writers.png",
  },
  // {
  //   title: "Voice Preservation",
  //   description:
  //     "You're the writer—WriteRoom only assists. Our agents learn your style and tone, so you can maintain authenticity.",
  //   icon: Fingerprint,
  //   imageUrl:
  //     "https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&q=80&w=500&h=300",
  // },
  // {
  //   title: "Streamlined Workflow",
  //   description:
  //     "Use our clutter-free interface designed to keep you focused on writing—no distractions, no complex menus.",
  //   icon: Layout,
  //   imageUrl:
  //     "https://images.unsplash.com/photo-1507721999472-8ed4421c4af2?auto=format&fit=crop&q=80&w=500&h=300",
  // },
];

function FeatureCard({
  feature,
  isReversed = false,
}: {
  feature: any;
  isReversed: boolean;
}) {
  const cardRef = useRef(null);
  const { title, description, icon: Icon, imageUrl } = feature;

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add("show");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.5,
        rootMargin: "0px",
      },
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => {
      if (cardRef.current) {
        observer.unobserve(cardRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={cardRef}
      className={cn(
        "overflow-clip flex flex-col lg:flex-row lg:justify-between items-center gap-8 p-6 rounded-2xl bg-gradient-to-tl from-primary/15 to-background backdrop-blur-lg",
        isReversed ? "lg:flex-row-reverse bg-gradient-to-tr" : "",
      )}
    >
      <div className="flex-1 space-y-4">
        <div className="flex items-center gap-3">
          <Icon className="w-6 h-6 text-primary" />
          <h3 className="text-2xl font-semibold text-primary">{title}</h3>
        </div>
        <p
          className="text-muted-foreground leading-relaxed"
          dangerouslySetInnerHTML={{
            __html: description,
          }}
        />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        whileInView={{ opacity: 1, y: 40 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      >
        <img
          src={imageUrl}
          alt={title}
          className="rounded-lg w-[430px] h-[300px] object-cover"
        />
      </motion.div>
    </div>
  );
}

function FeaturesSection() {
  return (
    <section className="min-h-screen bg-background relative">
      <div className="container max-w-6xl mx-auto px-4 py-16 sm:px-6 lg:px-8 relative">
        <p className="absolute w-full flex justify-center top-0 py-4 text-pink-400">
          There&apos;s a better way...
        </p>
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl mb-4">
            Powerful features for modern writers
          </h2>
          <p className="text-muted-foreground/80 text-2xl font-normal">
            (Everything you need)
          </p>
        </div>

        <div className="space-y-12">
          {features.map((feature, index) => (
            <FeatureCard
              key={feature.title}
              feature={feature}
              isReversed={index % 2 !== 0}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export default FeaturesSection;
