import React, { useEffect, useRef } from "react";
import { Brain, Pen, Fingerprint, Database, Layout } from "lucide-react";

const features = [
  {
    title: "Idea Generation & Outlines",
    description:
      "Never stare at a blank page again. Get customized titles, outlines, and topic suggestions drawn from millions of articles.",
    icon: Brain,
    imageUrl:
      "https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?auto=format&fit=crop&q=80&w=500&h=300",
  },
  {
    title: "Real-Time AI Assistance",
    description:
      "Refine your tone, improve readability, and spot overlooked details without losing your signature style.",
    icon: Pen,
    imageUrl:
      "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&q=80&w=500&h=300",
  },
  {
    title: "Voice Preservation",
    description:
      "You're the writer—WriteRoom only assists. Maintain authenticity with adjustable tone and style controls.",
    icon: Fingerprint,
    imageUrl:
      "https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&q=80&w=500&h=300",
  },
  {
    title: "Research at Your Fingertips",
    description:
      "Pull in relevant data and insights from top articles to keep your content informed and up-to-date.",
    icon: Database,
    imageUrl:
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=500&h=300",
  },
  {
    title: "Streamlined Workflow",
    description:
      "Use our clutter-free interface designed to keep you focused on writing—no distractions, no complex menus.",
    icon: Layout,
    imageUrl:
      "https://images.unsplash.com/photo-1507721999472-8ed4421c4af2?auto=format&fit=crop&q=80&w=500&h=300",
  },
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
      className={`feature-card flex flex-col lg:flex-row items-center gap-8 p-6 rounded-2xl bg-black/5 backdrop-blur-lg ${isReversed ? "lg:flex-row-reverse" : ""}`}
    >
      <div className="flex-1 space-y-4">
        <div className="flex items-center gap-3">
          <Icon className="w-6 h-6 text-indigo-600" />
          <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
        </div>
        <p className="text-gray-600 leading-relaxed">{description}</p>
      </div>
      <div className="flex-1 image-container opacity-0 translate-y-16 transition-all duration-700">
        <img
          src={imageUrl}
          alt={title}
          className="rounded-lg shadow-xl w-full h-[300px] object-cover"
        />
      </div>
    </div>
  );
}

function Features() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Powerful Features for Modern Writers
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Everything you need to write better content, faster and more
            efficiently.
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
    </div>
  );
}

export default Features;
