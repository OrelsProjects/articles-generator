import React, { useEffect, useRef, useState } from "react";
import { Brain, Pen, Folders } from "lucide-react";
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
    title: "Idea generation & outlines",
    description:
      "Never stare at a blank page again. Get unique ideas, customized titles and outlines suggestions <strong>based on millions of the best articles in your niche</strong>.",
    icon: Brain,
    // imageUrl: "/landing/generated-ideas.png",
    videoUrl:
      "https://apps-og-images.s3.us-east-1.amazonaws.com/write-room/videos/generate-ideas.mp4",
    objectFit: "fit",
  },
  {
    title: "Real-Time AI assistance",
    description:
      "Refine your tone, improve readability, and get more details without losing your writing style. <strong>Outline only.</strong>",
    icon: Pen,
    videoUrl:
      "https://apps-og-images.s3.us-east-1.amazonaws.com/write-room/videos/ai-assistance.mp4",
    objectFit: "fit",
  },
  {
    title: "Same beloved text features",
    description: `<strong>Pullquote?</strong> Check.
      <br/><strong>Blockquote?</strong> Check.
      <br/><strong>Easy copy to and from Substack?</strong> Check.
      <br/><strong>Create a new Substack draft fast?</strong> Check.
      <br/><br/> Something's missing? Send me a <a class="text-primary underline" href='mailto:orelsmail@gmail.com'>message</a> to my private email.
      <br/>I'll take care of it.`,
    icon: SubstackLogo,
    videoUrl:
      "https://apps-og-images.s3.us-east-1.amazonaws.com/write-room/videos/substack-adjusted-full.mp4",
    objectFit: "cover",
  },
  {
    title: "No more mess in drafts",
    description: `Easily organize your drafts into folders, instead of having them all in one place.
      <br/>Oh, and deleting a draft doesn't take ages. ;)
      `,
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
