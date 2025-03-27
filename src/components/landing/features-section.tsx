import React, { useEffect, useRef, useState } from "react";
import { Brain, Pen, Folders, DollarSign, Users } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import Image from "next/image";
import useMediaQuery from "@/lib/hooks/useMediaQuery";
import { appName } from "@/lib/consts";

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
    title: "Easily organize your posts",
    description: `Instead of having a massive list of drafts, you can easily organize your posts into folders. Fast.`,
    icon: Folders,
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
        "w-full overflow-clip flex flex-col lg:flex-row lg:justify-between items-center gap-8 p-6 rounded-2xl relative",
        isReversed ? "lg:flex-row-reverse bg-gradient-to-tr" : "",
      )}
    >
      {isReversed ? (
        <div className="absolute inset-0 rounded-2xl bg-[radial-gradient(ellipse_at_bottom_right,_hsla(24.6,95%,53.1%,0.15),_transparent,_transparent)] z-20"></div>
      ) : (
        <div className="absolute inset-0 rounded-2xl bg-[radial-gradient(ellipse_at_bottom_left,_hsla(24.6,95%,53.1%,0.15),_transparent,_transparent)] z-20"></div>
      )}
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
    <section id="features" className="landing-section-container bg-muted px-6 md:px-0">
      <div className="mx-auto relative">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl mb-4">
            See how {appName} helps you write articles
            <br /> <span className="text-primary">faster</span> and{" "}
            <span className="text-primary">better</span>
          </h2>
          <p>
            An AI-powered, Substack-like text editor that will make sure you
            never stare at a blank page again.
            <span className="hidden">
              <br /> generates outlines and guide you when you&apos;re stuck.
            </span>
            <br />
            Oh, and everything is ultra personalized to your writing style and
            topics.
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
