import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export const HeroSection = () => (
  <section className="h-fit min-h-screen w-screen max-w-6xl mx-auto flex flex-col items-center justify-start py-12 pb-28 relative">
    {/* Background grid lines */}
    <div className="absolute inset-0 w-full h-full z-0 overflow-hidden">
      {/* Vertical lines */}
      <div className="absolute inset-0 flex justify-between h-[33rem] w-full">
        {[...Array(2)].map((_, i) => (
          <div
            key={`v-line-${i}`}
            className="h-full w-0.5 bg-gradient-to-b from-transparent to-primary/20"
          />
        ))}
      </div>
      <div className="absolute inset-0 top-[33rem] flex justify-between h-[calc(100%-33rem)] w-full">
        {[...Array(2)].map((_, i) => (
          <div key={`v-line-${i}`} className="h-[full] w-0.5 bg-primary/20" />
        ))}
      </div>

      {/* Horizontal lines */}
      <div className="absolute inset-0 flex flex-col justify-end pb-5 gap-20 h-[33rem]">
        {[...Array(2)].map((_, i) => (
          <div
            key={`h-line-${i}`}
            className={cn("w-full h-0.5 bg-primary/20", {
              "bg-primary/0": i === 1,
            })}
          />
        ))}
      </div>
      {/* <div className="absolute bottom-2 flex justify-between w-full h-[27rem]">
        {[...Array(11)].map((_, i) => (
          <div
            key={`v-line-${i}`}
            className={cn("h-full w-5 border-x-2 border-primary/20", {
              "border-none": i === 0 || i === 10,
            })}
          />
        ))}
      </div> */}

      {/* Blue accent line at the bottom */}
      {/* <div className="absolute bottom-0 left-0 right-0 h-2 bg-primary/20 rounded-t-full" /> */}
    </div>

    <div className="w-screen container flex items-center justify-center relative z-10">
      <div className="flex-1 space-y-8 w-full">
        <div className="flex flex-col gap-16 items-center text-center lg:text-left">
          <h1 className="text-center font-extrabold text-4xl sm:text-6xl tracking-tight !leading-[1.2] md:-mb-4">
            The growth platform
            <br />
            {/* <span className="text-primary bg-primary/20 rounded-md p-1 py-0"> */}
              for Substack leaders
            {/* </span> */}
          </h1>

          {/* Feature list */}
          <ul className="w-full flex gap-2 justify-center">
            {[
              "SEARCH VIRAL NOTES FOR IDEAS",
              "WRITTEN DRAFT IN SECONDS",
              "AI-ASSISTED TEXT-EDITOR",
            ].map((feature, index) => (
              <li
                key={index}
                className="w-fit flex items-center space-x-3 bg-primary/10 rounded-full p-1 border border-primary/60 shadow-md shadow-primary/20"
              >
                <div className="bg-primary rounded-full p-1">
                  <Check className="h-2 w-2 flex-none text-background" />
                </div>
                <span className="text-sm font-black text-primary leading-tight md:leading-relaxed text-left">
                  {feature}
                </span>
              </li>
            ))}
          </ul>

          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <Button
              size="lg"
              className="bg-primary text-lg hover:bg-primary/90 text-primary-foreground px-8 sm:px-16 py-6 font-bold rounded-xl w-full sm:w-auto"
              asChild
            >
              <Link href="#pricing">Try 7-day free trial</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-lg hover:bg-primary/10 px-8 sm:px-16 py-6 font-semibold rounded-xl w-full sm:w-auto"
              asChild
            >
              <Link href="/login">Login</Link>
            </Button>
          </div>
          <div className="relative w-screen max-w-6xl h-[600px] bg-gradient-to-b from-primary via-primary/80 to-primary/60 rounded-[32px] flex items-center justify-center">
            <motion.img
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.3 }}
              src="/landing/landing-hero.png"
              alt="Hero"
              className="absolute mx-auto mt-32 w-screen max-w-5xl !h-[600px] rounded-[32px] shadow-md"
            />
          </div>
        </div>
      </div>
    </div>
  </section>
);
