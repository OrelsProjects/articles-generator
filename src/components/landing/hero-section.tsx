import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import Link from "next/link";

export const HeroSection = () => (
  <section className="h-fit min-h-screen w-screen bg-background py-12 pb-28 rounded-b-[3rem] shadow-lg overflow-y-visible relative">
    <div className="w-full h-full  max-w-6xl mx-auto flex flex-col items-center justify-start relative">
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
      </div>

      <div className="w-screen container flex items-center justify-center relative z-10">
        <div className="flex-1 space-y-8 w-full">
          <div className="flex flex-col gap-16 items-center text-center lg:text-left">
            <h1 className="text-center font-extrabold text-4xl sm:text-6xl tracking-tight !leading-[1.2] lg:-mb-4">
              The growth platform
              <br />
              {/* <span className="text-primary bg-primary/20 rounded-md p-1 py-0"> */}
              for Substack leaders
              {/* </span> */}
            </h1>

            {/* Feature list */}
            <ul className="w-full flex flex-col lg:flex-row gap-2 justify-center items-center">
              {[
                "VIRAL NOTES RESEARCH TOOL",
                "PERSONALIZED NOTES",
                "AI-ASSISTED TEXT-EDITOR",
              ].map((feature, index) => (
                <li
                  key={index}
                  className="w-fit flex items-center space-x-3 bg-primary/5 rounded-full p-2 px-4 border border-primary/60 shadow-md shadow-primary/20"
                >
                  <div className="bg-primary rounded-full p-1">
                    <Check className="h-2.5 w-2.5 flex-none text-background" />
                  </div>
                  <span className="text-sm font-black text-primary leading-tight lg:leading-relaxed text-left">
                    {feature}
                  </span>
                </li>
              ))}
            </ul>

            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <Button
                size="lg"
                className="bg-primary text-lg hover:bg-primary/90 text-primary-foreground mt-6 px-8 sm:px-16 lg:mt-0 py-6 font-bold rounded-xl w-full sm:w-auto"
                asChild
              >
                <Link href="#pricing">Try 7-day free trial</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-lg hover:bg-primary/10 px-8 sm:px-16 py-6 font-semibold rounded-xl w-full sm:w-auto hidden lg:flex"
                asChild
              >
                <Link href="/login">Login</Link>
              </Button>
            </div>
            <div className="w-screen h-fit px-4 flex justify-center items-center">
              <div className="relative w-screen h-[220px] lg:max-w-6xl lg:h-[600px] bg-gradient-to-b from-primary via-primary/80 to-primary/60 rounded-[32px] flex items-center justify-center overflow-clip lg:overflow-visible">
                <motion.img
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.3 }}
                  src="/landing/landing-hero.png"
                  alt="Hero"
                  className="absolute mx-auto mt-32 w-full max-w-5xl lg:!h-[600px] rounded-[32px] shadow-md translate-x-10 -translate-y-8 lg:translate-x-0 lg:translate-y-0"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);
