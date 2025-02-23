import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export const HeroSection = () => (
  <section className="min-h-[98vh] container py-12 mx-auto flex flex-col items-center justify-center">
    <div className="w-screen container bg-base-100 flex flex-col lg:flex-row items-center justify-center lg:justify-between gap-12 py-8 lg:py-20 px-6 md:px-0 xl:px-20">
      {/* Left side content */}
      <div className="flex-1 space-y-8 w-full">
        <div className="flex flex-col gap-8 items-center lg:items-start text-center lg:text-left">
          <h1 className="font-extrabold text-4xl sm:text-6xl tracking-tight !leading-[1.2] md:-mb-4">
            Generate article ideas
            <br />
            and write them in minutes
          </h1>
          <p className="text-lg leading-relaxed max-w-xl">
            The AI-powered text editor that helps you generate ideas, structure
            outlines, and refine your writing—without replacing your voice.
          </p>

          {/* Feature list */}
          <ul className="space-y-3 w-full max-w-xl">
            {[
              "Generate personally-tailored unique ideas",
              "Get an outline based on your writing style",
              "Based on millions of the best articles",
              "Break through writer's block",
              "Write faster and better",
            ].map((feature, index) => (
              <li key={index} className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 flex-none text-primary" />
                <span className="text-base md:text-lg leading-tight md:leading-relaxed text-left">
                  {feature}
                </span>
              </li>
            ))}
          </ul>

          <Button
            size="lg"
            className="bg-primary text-lg hover:bg-primary/90 text-primary-foreground px-8 sm:px-20 py-6 font-semibold rounded-xl w-full sm:w-auto"
            asChild
          >
            <Link href="#pricing">Try it for free</Link>
          </Button>
        </div>
      </div>

      {/* Right side - Substack branding */}
      <div className="hidden md:flex flex-col items-center justify-center gap-4 w-full lg:w-auto">
        <Image
          src="/landing/substack-logo-shadow.png"
          alt="Substack Logo"
          width={300}
          height={300}
          className="w-32 h-32 sm:w-64 sm:h-64"
        />
        <div className="flex flex-col gap-2 items-center justify-center text-center">
          <p className="text-3xl sm:text-5xl font-semibold text-primary">
            For Substack writers
          </p>
          <p className="text-lg sm:text-xl font-semibold">
            By Substack writers
          </p>
        </div>
      </div>
    </div>
  </section>
);
