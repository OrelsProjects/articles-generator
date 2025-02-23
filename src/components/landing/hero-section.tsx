import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export const HeroSection = () => (
  <section className="h-[98vh] container px-4 py-12 mx-auto flex flex-col items-center justify-center">
    <div className="max-w-6xl mx-auto bg-base-100 flex flex-row items-center justify-center px-8 py-8 lg:py-20">
      <div className="space-y-8">
        {/* Hero content */}
        <div className="flex flex-col gap-8 items-center justify-center text-center lg:text-left lg:items-start">
          <h1 className="font-extrabold text-5xl lg:text-5xl tracking-tight !leading-[62px] md:-mb-4">
            Generate article ideas
            <br />
            and write them in minutes
          </h1>
          <p className="text-lg leading-relaxed">
            The AI-powered text editor that helps you generate ideas, structure
            outlines, and refine your writing—without replacing your voice.
          </p>

          {/* Feature list */}
          <ul className="space-y-3">
            {[
              "Generate perosnally-tailored unique ideas",
              "Get an outline based on your writing style",
              "Based on millions of the best articles",
              "Break through writer's block",
              "Write faster and better",
            ].map((feature, index) => (
              <li key={index} className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 flex-none text-primary" />
                <span className="text-base md:text-lg leading-tight md:leading-relaxed">
                  {feature}
                </span>
              </li>
            ))}
          </ul>

          <Button
            size="lg"
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-16 py-5 font-semibold rounded-xl"
            asChild
          >
            <Link href="#pricing">Try it for free</Link>
          </Button>
        </div>

        {/* Social proof */}
        {/* <div className="flex items-center space-x-4">
          <div className="flex -space-x-2">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="relative w-8 h-8 rounded-full border-2 border-white overflow-hidden"
              >
                <Image
                  src={`/placeholder.svg?height=32&width=32`}
                  alt={`User ${i + 1}`}
                  width={32}
                  height={32}
                  className="object-cover"
                />
              </div>
            ))}
          </div>
          <div className="flex items-center space-x-1">
            <div className="flex text-yellow-400">
              {[...Array(5)].map((_, i) => (
                <svg
                  key={i}
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <p>
              Loved by <span className="font-semibold">4361</span> small
              businesses
            </p>
          </div>
        </div> */}
      </div>

      {/* Platform icons */}
      {/* <div className="relative"> */}
      <div className="w-[1000px] h-full flex flex-col items-center justify-center gap-4 relative">
        {/* <p className="text-2xl font-semibold">Built by Substack writers</p> */}
        <Image
          src="/landing/substack-logo.png"
          alt="Social media platforms"
          fill
          className="!relative !h-52 !w-52 hidden sm:block"
        />
        <p className="flex flex-col gap-2 items-center justify-center">
          <p className="text-5xl font-semibold text-primary">
            For Substack writers
          </p>
          <p className="text-xl font-semibold">By Substack writers</p>
        </p>
        {/* <Image
          src="/landing/for-substack-writers.png"
          alt="Social media platforms"
          fill
          className="!relative !w-full hidden sm:block"
        /> */}
      </div>
      {/* <Badge className="absolute text-center h-12 w-fit bottom-4 left-1/2 -translate-x-1/2 bg-background text-foreground shadow-inner shadow-substack-orange/30 border-substack-orange backdrop-blur-sm text-lg !p-8">
          Built for Substack writers <br />
          By Substack writers
        </Badge> */}
      {/* </div> */}
    </div>
  </section>
);
