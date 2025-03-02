import React, { useEffect, useRef, useState } from "react";
import { Brain, Pen, Folders, DollarSign, Users } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import Image from "next/image";
import useMediaQuery from "@/lib/hooks/useMediaQuery";

const SubstackLogo = ({ className }: { className?: string }) => (
  <div className={cn("bg-primary rounded-lg p-1", className)}>
    <Image
      src="/landing/substack-logo-white.png"
      alt="Substack Logo"
      fill
      className={cn("!relative object-contain")}
    />
  </div>
);
const features = [
  {
    title: "Newsletter idea generation",
    description:
      "Never stare at a blank page again. Get unique ideas, customized titles and outlines suggestions <strong>based on millions of the best Substack newsletters in your niche</strong>. Perfect for writers with <strong>20+ published newsletters</strong>.",
    icon: Brain,
    videoUrl:
      "https://apps-og-images.s3.us-east-1.amazonaws.com/write-room/videos/generate-ideas.mp4",
    objectFit: "fit",
  },
  {
    title: "Direct Substack integration",
    description:
      "No more copying and pasting between ChatGPT and Substack. Write, enhance, and publish—all in one place. <strong>Save hours every week</strong> with our seamless workflow.",
    icon: SubstackLogo,
    videoUrl:
      "https://apps-og-images.s3.us-east-1.amazonaws.com/write-room/videos/substack-adjusted-full.mp4",
    objectFit: "cover",
  },
  {
    title: "AI assistance that preserves your voice",
    description:
      "Refine your tone, improve readability, and add details without losing your unique writing style. <strong>Grow your audience</strong> with consistently high-quality newsletters.",
    icon: Pen,
    videoUrl:
      "https://apps-og-images.s3.us-east-1.amazonaws.com/write-room/videos/ai-assistance.mp4",
    objectFit: "fit",
  },
  {
    title: "Audience & income growth tools",
    description: `Specifically designed for Substack writers earning <strong>$1k+/month</strong> who want to scale their newsletter business. Our tools help you <strong>increase subscriber engagement</strong> and <strong>boost your monthly income</strong>.`,
    icon: DollarSign,
    videoUrl:
      "https://apps-og-images.s3.us-east-1.amazonaws.com/write-room/videos/organized-folders.mp4",
    objectFit: "fit",
  },
];

function FeatureCard({
  feature,
  isReversed = false,
  isMobile = false,
}: {
  feature: any;
  isReversed: boolean;
  isMobile: boolean;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const mediaRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const {
    title,
    description,
    icon: Icon,
    imageUrl,
    videoUrl,
    objectFit = "cover",
  } = feature;

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            setTimeout(() => {
              videoRef.current?.play();
            }, 200);

            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: isMobile ? 0.3 : 0.4,
        rootMargin: isMobile ? "-30%" : "0px 0px -40% 0px",
      },
    );

    if (mediaRef.current) {
      observer.observe(mediaRef.current);
    }

    return () => {
      if (mediaRef.current) {
        observer.unobserve(mediaRef.current);
      }
    };
  }, [isMobile]);

  // set video speed to 1.5
  useEffect(() => {
    if (videoUrl) {
      if (videoRef.current) {
        videoRef.current.playbackRate = 1.5;
      }
    }
  }, [videoUrl]);

  return (
    <div
      ref={cardRef}
      className={cn(
        "w-full overflow-clip flex flex-col lg:flex-row lg:justify-between items-center gap-8 p-6 rounded-2xl bg-gradient-to-tl from-primary/15 to-background backdrop-blur-lg",
        isReversed ? "lg:flex-row-reverse bg-gradient-to-tr" : "",
      )}
    >
      <div className="flex-1 space-y-4">
        <div className="flex items-center gap-3">
          <Icon className="!w-6 !h-6 text-primary" />
          <h3 className="text-2xl font-semibold text-primary">{title}</h3>
        </div>
        <p
          className="text-muted-foreground leading-relaxed"
          dangerouslySetInnerHTML={{
            __html: description,
          }}
        />
      </div>
      <div ref={mediaRef}>
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 100 }}
          animate={{
            opacity: isVisible ? 1 : 0,
            scale: isVisible ? 1 : 0.8,
            y: isVisible ? 0 : 100,
          }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="bg-white rounded-lg w-[330px] h-[200px] md:w-[430px] md:h-[300px] flex justify-center items-center"
        >
          {videoUrl ? (
            <video
              ref={videoRef}
              id={`${title}-video`}
              src={videoUrl}
              muted
              loop
              playsInline
              className={cn(
                "rounded-lg w-[330px] h-[200px] md:w-[430px] md:h-[300px] object-fit",
                {
                  "!object-cover": objectFit === "cover",
                },
              )}
              style={{ opacity: isVisible ? 1 : 0 }}
            />
          ) : imageUrl ? (
            <img
              src={imageUrl}
              alt={title}
              className={cn(
                "rounded-lg w-[330px] h-[200px] md:w-[430px] md:h-[300px] object-fit",
                {
                  "!object-cover": objectFit === "cover",
                },
              )}
              style={{ opacity: isVisible ? 1 : 0 }}
            />
          ) : null}
        </motion.div>
      </div>
    </div>
  );
}

function FeaturesSection() {
  const isMobile = useMediaQuery("(max-width: 768px)");

  return (
    <section id="features" className="min-h-screen bg-background relative">
      <div className="w-screen max-w-5xl mx-auto px-4 py-16 md:px-0 relative">
        <p className="absolute w-full flex justify-center top-0 py-4 text-pink-400">
          The solution you&apos;ve been waiting for...
        </p>
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl mb-4">
            Powerful features for serious Substack writers
          </h2>
          <p className="text-muted-foreground/80 text-2xl font-normal">
            (Designed for writers with 20+ newsletters earning $1k+/month)
          </p>
        </div>

        <div className="w-full space-y-12">
          {features.map((feature, index) => (
            <FeatureCard
              key={feature.title}
              feature={feature}
              isReversed={index % 2 !== 0}
              isMobile={isMobile}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export default FeaturesSection;
