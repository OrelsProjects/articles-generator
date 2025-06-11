import React, { useState, useEffect } from "react";
import { BarChart, Users, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const features = [
  {
    id: "notes-statistics",
    title: "Notes Statistics - All in one place",
    description: "See all your scattered notes statistics in one glance",
    icon: BarChart,
    preview:[ "/landing/features/stats-notes.png", "/landing/features/stats-notes-2.png"],
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
  const [currentImageIndex, setCurrentImageIndex] = useState<{ [key: number]: number }>({});
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);
  const [imageDirection, setImageDirection] = useState<{ [key: number]: number }>({});

  // Get current preview images for a feature
  const getCurrentPreview = (featureIndex: number) => {
    const feature = features[featureIndex];
    const previews = Array.isArray(feature.preview) ? feature.preview : [feature.preview];
    const currentIndex = currentImageIndex[featureIndex] || 0;
    return previews[currentIndex];
  };

  // Get all preview images for a feature
  const getAllPreviews = (featureIndex: number) => {
    const feature = features[featureIndex];
    return Array.isArray(feature.preview) ? feature.preview : [feature.preview];
  };

  // Auto-rotate images every 3 seconds (pause on hover)
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex(prev => {
        const newState = { ...prev };
        features.forEach((feature, index) => {
          // Don't auto-rotate if this feature is being hovered
          if (Array.isArray(feature.preview) && feature.preview.length > 1 && hoveredFeature !== index) {
            const currentIndex = prev[index] || 0;
            newState[index] = (currentIndex + 1) % feature.preview.length;
            // Set direction for animation
            setImageDirection(prevDir => ({ ...prevDir, [index]: 1 }));
          }
        });
        return newState;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [hoveredFeature]);

  // Navigate to specific image
  const navigateToImage = (featureIndex: number, imageIndex: number) => {
    const currentIndex = currentImageIndex[featureIndex] || 0;
    const direction = imageIndex > currentIndex ? 1 : -1;
    
    setImageDirection(prev => ({ ...prev, [featureIndex]: direction }));
    setCurrentImageIndex(prev => ({
      ...prev,
      [featureIndex]: imageIndex
    }));
  };

  // Navigate to next/previous image
  const navigateImage = (featureIndex: number, direction: 'next' | 'prev') => {
    const previews = getAllPreviews(featureIndex);
    if (previews.length <= 1) return;

    const directionValue = direction === 'next' ? 1 : -1;
    setImageDirection(prev => ({ ...prev, [featureIndex]: directionValue }));

    setCurrentImageIndex(prev => {
      const currentIndex = prev[featureIndex] || 0;
      const newIndex = direction === 'next' 
        ? (currentIndex + 1) % previews.length
        : (currentIndex - 1 + previews.length) % previews.length;
      
      return {
        ...prev,
        [featureIndex]: newIndex
      };
    });
  };

  // Preload all images
  useEffect(() => {
    const allImages = features.flatMap(feature => 
      Array.isArray(feature.preview) ? feature.preview : [feature.preview]
    );
    
    const imagePromises = allImages.map((imageSrc) => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = resolve;
        img.onerror = reject;
        img.src = imageSrc;
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
                    x: { type: "spring", stiffness: 200, damping: 35, mass: 1 },
                    opacity: { duration: 0.4, ease: "easeInOut" },
                  }}
                  className="absolute inset-0"
                >
                  <div className="p-8 h-full flex items-center justify-center  overflow-visible">
                    <motion.div
                      className="w-full max-w-lg bg-background rounded-lg border shadow-sm p-6 relative overflow-visible"
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.1, duration: 0.3 }}
                    >
                      <div
                        className="relative overflow-visible rounded-lg"
                        onMouseEnter={() => setHoveredFeature(activeTab)}
                        onMouseLeave={() => setHoveredFeature(null)}
                      >
                        <AnimatePresence
                          initial={false}
                          custom={imageDirection[activeTab] || 1}
                          mode="popLayout"
                        >
                          <motion.img
                            key={`${activeTab}-${currentImageIndex[activeTab] || 0}`}
                            src={getCurrentPreview(activeTab)}
                            alt={features[activeTab].title}
                            className="w-full h-full object-contain"
                            loading="eager"
                            custom={imageDirection[activeTab] || 1}
                            variants={{
                              enter: (direction: number) => ({
                                x: direction > 0 ? "100%" : "-100%",
                                opacity: 0,
                                scale: 1,
                              }),
                              center: {
                                x: 0,
                                opacity: imagesLoaded ? 1 : 0,
                                scale: hoveredFeature === activeTab ? 1.2 : 1,
                              },
                              exit: (direction: number) => ({
                                x: direction > 0 ? "-100%" : "100%",
                                opacity: 0,
                                scale: 1,
                              }),
                            }}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{
                              x: {
                                type: "spring",
                                stiffness: 300,
                                damping: 30,
                              },
                              opacity: { duration: 0.3 },
                              scale: { duration: 0.3, ease: "easeOut" },
                            }}
                            style={{
                              transition: "transform 0.3s ease-out",
                            }}
                          />
                        </AnimatePresence>

                        {/* Navigation arrows - only show if multiple images */}
                        {getAllPreviews(activeTab).length > 1 && (
                          <>
                            <Button
                              onClick={() => navigateImage(activeTab, "prev")}
                              className={cn(
                                "absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 border rounded-full p-2 shadow-md transition-all duration-200 hover:scale-110",
                                hoveredFeature === activeTab
                                  ? "opacity-85 hover:opacity-100"
                                  : "opacity-70",
                              )}
                            >
                              <ChevronLeft className="w-4 h-4 text-foreground" />
                            </Button>
                            <Button
                              onClick={() => navigateImage(activeTab, "next")}
                              className={cn(
                                "absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 border rounded-full p-2 shadow-md transition-all duration-200 hover:scale-110",
                                hoveredFeature === activeTab
                                  ? "opacity-85 hover:opacity-100"
                                  : "opacity-70",
                              )}
                            >
                              <ChevronRight className="w-4 h-4 text-foreground" />
                            </Button>
                          </>
                        )}

                        {/* Dots indicator - only show if multiple images */}
                        {getAllPreviews(activeTab).length > 1 && (
                          <div
                            className={cn(
                              "absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2 transition-all duration-200",
                              hoveredFeature === activeTab
                                ? "opacity-80"
                                : "opacity-60",
                            )}
                          >
                            {getAllPreviews(activeTab).map((_, index) => (
                              <Button
                                key={index}
                                onClick={() =>
                                  navigateToImage(activeTab, index)
                                }
                                className={cn(
                                  "w-2 h-2 rounded-full transition-all duration-200 hover:scale-150 p-0",
                                  (currentImageIndex[activeTab] || 0) === index
                                    ? "bg-primary scale-125"
                                    : "bg-muted-foreground/50 hover:bg-muted-foreground/80",
                                )}
                              >
                                <div className="w-2 h-2 rounded-full transition-all duration-200 hover:scale-150" />
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>

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
        {features.map((feature, featureIndex) => {
          const Icon = feature.icon;
          const previews = getAllPreviews(featureIndex);
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
              <div
                className="relative w-full overflow-hidden rounded-lg"
                onMouseEnter={() => setHoveredFeature(featureIndex)}
                onMouseLeave={() => setHoveredFeature(null)}
              >
                <AnimatePresence
                  initial={false}
                  custom={imageDirection[featureIndex] || 1}
                >
                  <motion.img
                    key={`${featureIndex}-${currentImageIndex[featureIndex] || 0}`}
                    src={getCurrentPreview(featureIndex)}
                    alt={feature.title}
                    className="w-full h-48 object-contain rounded-lg mt-2"
                    loading="eager"
                    custom={imageDirection[featureIndex] || 1}
                    variants={{
                      enter: (direction: number) => ({
                        x: direction > 0 ? "100%" : "-100%",
                        opacity: 0,
                        scale: 1,
                      }),
                      center: {
                        x: 0,
                        opacity: 1,
                        scale: hoveredFeature === featureIndex ? 1.2 : 1,
                      },
                      exit: (direction: number) => ({
                        x: direction > 0 ? "-100%" : "100%",
                        opacity: 0,
                        scale: 1,
                      }),
                    }}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{
                      x: { type: "spring", stiffness: 300, damping: 30 },
                      opacity: { duration: 0.3 },
                      scale: { duration: 0.3, ease: "easeOut" },
                    }}
                  />
                </AnimatePresence>

                {/* Navigation arrows - only show if multiple images */}
                {previews.length > 1 && (
                  <>
                    <button
                      onClick={() => navigateImage(featureIndex, "prev")}
                      className={cn(
                        "absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 border rounded-full p-2 shadow-md transition-all duration-200 hover:scale-110",
                        hoveredFeature === featureIndex
                          ? "opacity-60 hover:opacity-100"
                          : "opacity-0",
                      )}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => navigateImage(featureIndex, "next")}
                      className={cn(
                        "absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 border rounded-full p-2 shadow-md transition-all duration-200 hover:scale-110",
                        hoveredFeature === featureIndex
                          ? "opacity-60 hover:opacity-100"
                          : "opacity-0",
                      )}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </>
                )}

                {/* Dots indicator - only show if multiple images */}
                {previews.length > 1 && (
                  <div
                    className={cn(
                      "absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 transition-all duration-200",
                      hoveredFeature === featureIndex
                        ? "opacity-80"
                        : "opacity-0",
                    )}
                  >
                    {previews.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => navigateToImage(featureIndex, index)}
                        className={cn(
                          "w-2 h-2 rounded-full transition-all duration-200 hover:scale-150",
                          (currentImageIndex[featureIndex] || 0) === index
                            ? "bg-primary scale-125"
                            : "bg-muted-foreground/50 hover:bg-muted-foreground/80",
                        )}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
