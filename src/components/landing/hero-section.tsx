import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { motion } from "framer-motion";
import { Check, Sparkles, Star } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import axiosInstance from "@/lib/axios-instance";

export const HeroSection = () => {
  const [count, setCount] = useState("");
  const [topFiveImages, setTopFiveImages] = useState<string[]>([]);

  const fetchData = async () => {
    try {
      const response = await axiosInstance.get("/api/landing/users");
      setCount(response.data.count);
      setTopFiveImages(response.data.topFiveImages);
    } catch (error) {}
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
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
              <div
                key={`v-line-${i}`}
                className="h-[full] w-0.5 bg-primary/20"
              />
            ))}
          </div>

          {/* Horizontal lines */}
          <div className="absolute inset-0 flex flex-col justify-end pb-5 gap-20 h-[37rem]">
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
              <div className="flex flex-col gap-3">
                <h3>
                  A simple to use, AI-powered writing assistant for Substack
                  creators
                </h3>
                <h1 className="text-center font-extrabold text-4xl sm:text-6xl tracking-tight !leading-[1.2]">
                  Turn Your Writing
                  <br />
                  {/* <span className="text-primary bg-primary/20 rounded-md p-1 py-0"> */}
                  Into Income <span className="text-primary">5x Faster</span>
                  {/* </span> */}
                </h1>
                <h3 className="text-center text-lg mt-3">
                  Stop guessing what will go viral.
                  <br /> Start writing, growing, and earning like a Substack
                  Best Seller.
                </h3>
                {/* <h3 className="text-center text-lg mt-2">
                  (With 10x more confidence)
                </h3> */}
                {/* <h3 className="text-center text-lg mt-2">
                  Stop guessing what will go viral. Start writing, growing, and
                  earning like a Substack Best Seller.
                </h3> */}
              </div>

              {/* Feature list */}
              <ul className="w-full flex flex-col lg:flex-row gap-2 justify-center items-center">
                {[
                  "NOTES SCHEDULING",
                  "VIRAL NOTES RESEARCH TOOL",
                  "5X MORE SUBSCRIBERS",
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

              <div className="flex flex-col items-center">
                <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                  <Button
                    size="lg"
                    className="bg-primary text-lg hover:bg-primary/90 text-primary-foreground mt-[30px] px-8 sm:px-12 lg:mt-0 py-6 font-bold rounded-xl w-full sm:w-auto"
                    asChild
                  >
                    <Link href="/login">
                      <Sparkles className="mr-2" />
                      Start growing now
                    </Link>
                  </Button>
                  <Button
                    size="lg"
                    variant={"outline"}
                    className="text-lg mt-[30px] px-8 sm:px-12 lg:mt-0 py-6 font-bold rounded-xl w-full sm:w-auto"
                    asChild
                  >
                    <Link href="#features">Explore features</Link>
                  </Button>
                </div>
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
};
