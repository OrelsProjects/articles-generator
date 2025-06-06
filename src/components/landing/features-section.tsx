import React, { useState, useEffect } from "react";
import { BarChart, Users } from "lucide-react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { cn } from "@/lib/utils";

const features = [
  {
    id: "notes-statistics",
    title: "Notes Statistics - All in one place",
    description: "See all your scattered notes statistics in one glance",
    icon: BarChart,
    preview: "/landing/features/stats-notes.png",
  },
  {
    id: "fan-statistics",
    title: "Learn more about your Substack",
    description: "Get detailed statistics about your notes, and your fans.",
    icon: Users,
    preview: "/landing/features/stats-personal.png",
  },
  {
    id: "potential-users",
    title: "Find potential clients",
    description:
      "Find top engagers of your competitors and get potential clients",
    icon: Users,
    preview: "/landing/features/potential-clients.png",
  },
];

export default function FeaturesSection() {
  const [activeTab, setActiveTab] = useState(0);
  const [direction, setDirection] = useState(0);
  const [imagesLoaded, setImagesLoaded] = useState(false);

  // Preload all images
  useEffect(() => {
    const imagePromises = features.map((feature) => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = resolve;
        img.onerror = reject;
        img.src = feature.preview;
      });
    });

    Promise.all(imagePromises)
      .then(() => setImagesLoaded(true))
      .catch(() => setImagesLoaded(true)); // Set to true even on error to prevent infinite loading
  }, []);

  const handleTabChange = (newTab: number) => {
    // next → slide left, prev → slide right
    setDirection(newTab > activeTab ? 1 : -1);
    setActiveTab(newTab);
  };

  return (
    <section className="landing-section-container bg-background flex flex-col gap-4 rounded-[3rem] shadow-[0_0_10px_rgba(0,0,0,0.2)] px-6 md:px-0">
      <div className="mx-auto md:px-0 landing-section-top">
        <h2 className="mb-4">
          All your notes statistics in one place
          <br /> <span className="text-primary">Track</span> and{" "}
          <span className="text-primary">grow</span> your audience smarter
        </h2>
        <p className="text-center">
          A single glance. Not scattered around your notes.
        </p>
      </div>

      {/* Desktop */}
      <div className="hidden lg:grid lg:grid-cols-[3fr_4fr] gap-12 items-center">
        <LayoutGroup>
          {/* Left Side - Feature Cards */}
          <div className="space-y-4">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              const isActive = activeTab === index;

              return (
                <motion.div
                  key={feature.id}
                  layoutId={`card-${feature.id}`}
                  onClick={() => handleTabChange(index)}
                  className={cn(
                    "rounded-xl cursor-pointer transition-all duration-300 border-2 overflow-hidden",
                    "hover:shadow-lg",
                    isActive
                      ? "bg-primary/5 border-primary shadow-md"
                      : "bg-card border-border shadow-sm hover:border-primary/20 grayscale",
                  )}
                  animate={{ scale: isActive ? 1.03 : 0.98 }}
                  transition={{ duration: 0.25 }}
                >
                  <motion.div
                    className={cn(
                      "flex flex-col items-start gap-2 p-6",
                      isActive ? "" : "flex-row items-center",
                    )}
                    initial={false}
                  >
                    <motion.div
                      className={cn(
                        "p-3 rounded-lg flex-shrink-0 mb-0",
                        isActive
                          ? "bg-primary text-primary-foreground mx-auto mb-2"
                          : "bg-muted text-gray-400",
                      )}
                      animate={{ scale: isActive ? 1.15 : 1 }}
                    >
                      <Icon className="w-6 h-6" />
                    </motion.div>

                    {isActive ? (
                      <motion.div
                        className="w-full flex flex-col items-center text-center"
                        initial={{ y: 40, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 40, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <h3 className="font-semibold text-lg text-primary mb-2">
                          {feature.title}
                        </h3>
                        <p className="text-muted-foreground text-sm leading-relaxed pb-2">
                          {feature.description}
                        </p>
                      </motion.div>
                    ) : (
                      <h3 className="flex-1 min-w-0 ml-4 font-semibold text-lg text-gray-400">
                        {feature.title}
                      </h3>
                    )}
                  </motion.div>
                </motion.div>
              );
            })}
          </div>

          {/* Right Side - Preview */}
          <div className="lg:sticky lg:top-24">
            <div className="relative bg-card rounded-xl border shadow-lg overflow-hidden min-h-[500px]">
              <AnimatePresence initial={false} custom={direction}>
                <motion.div
                  key={activeTab}
                  custom={direction}
                  variants={{
                    enter: (direction: number) => ({
                      x: direction > 0 ? "100%" : "-100%",
                      opacity: 1,
                    }),
                    center: {
                      x: 0,
                      opacity: 1,
                    },
                    exit: (direction: number) => ({
                      x: direction > 0 ? "-100%" : "100%",
                      opacity: 1,
                    }),
                  }}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{
                    x: { type: "spring", stiffness: 300, damping: 30 },
                    opacity: { duration: 0.1 }
                  }}
                  className="absolute inset-0"
                >
                  <div className="p-8 h-full flex items-center justify-center">
                    <motion.div
                      className="w-full max-w-lg bg-background rounded-lg border shadow-sm p-6"
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.1, duration: 0.3 }}
                    >
                      <img
                        src={features[activeTab].preview}
                        alt={features[activeTab].title}
                        className="w-full h-full object-contain"
                        loading="eager"
                        style={{ 
                          opacity: imagesLoaded ? 1 : 0,
                          transition: 'opacity 0.3s ease-in-out'
                        }}
                    />
                      {!imagesLoaded && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                      )}
                    </motion.div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </LayoutGroup>
      </div>

      {/* Mobile */}
      <div className="flex flex-col gap-8 lg:hidden">
        {features.map(feature => {
          const Icon = feature.icon;
          return (
            <div
              key={feature.id}
              className="rounded-xl bg-card border border-border shadow-sm p-6 flex flex-col items-center"
            >
              <div className="p-3 rounded-lg bg-primary text-primary-foreground mb-2">
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-lg text-primary mb-2 text-center">
                {feature.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed pb-2 text-center">
                {feature.description}
              </p>
              <img
                src={feature.preview}
                alt={feature.title}
                className="w-full h-48 object-contain rounded-lg mt-2"
                loading="eager"
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}
