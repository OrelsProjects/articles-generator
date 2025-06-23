"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { appName, testimonials } from "@/lib/consts";
import { cn } from "@/lib/utils";
import { HeroSection } from "@/components/landing/hero-section";
import Header from "@/components/landing/header";
import OtherSolutions from "@/components/landing/other-solutions";
import Pricing from "@/components/landing/pricing-section";
import { ThemeProvider } from "@/app/providers/ThemeProvider";
import { UsedByTopCreators } from "@/components/landing/used-by-top-creators";
import ProductHighlightSection from "@/components/landing/product-highlight-section";
import FeaturesSection from "@/components/landing/features-section";
import WhyNotesSection from "@/components/landing/why-notes-section";
import { MasonryGrid } from "@/components/ui/masonry-grid";
import {
  BestSeller100,
  BestSeller1000,
  BestSeller10000,
} from "@/components/ui/best-seller-badge";
import { useEffect } from "react";

const DividerPrimary = ({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) => (
  <div
    className={cn(
      "w-full h-fit md:min-h-[400px] bg-primary flex justify-center items-center py-12 lg:py-0",
      className,
    )}
  >
    {children}
  </div>
);

const AnimatedHighlight = ({ children }: { children: React.ReactNode }) => {
  return (
    <span className="relative inline-block">
      <motion.span
        className="absolute inset-0 bg-orange-400 rounded-lg"
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.1, ease: "easeInOut" }}
        style={{ transformOrigin: "left" }}
      />
      <span className="relative px-4">{children}</span>
    </span>
  );
};

const faq = [
  {
    question: `Do I need to leave my computer running to schedule notes?`,
    answer: `Yes. Just leave the chrome running in the background (No matter which website) and it will automatically publish your notes at anytime you choose!`,
  },
  {
    question: `Do you use my draft notes?`,
    answer: `No. We never use your draft notes. We respect what you create and your drafts are private.`,
  },
  {
    question: `Can I choose the language for my notes?`,
    answer: `Yes! You can choose the language for your notes in the settings.
    <br/><br/>
    Go to Settings->Account Information->Preferred Language.
    <br/><br/>
    You can choose: English, Español, Français, Deutsch, Italiano, Português, Русский, 中文, 日本語, 한국어.
    <br/><br/>
    Feel free to request more languages.
    `,
  },
  {
    question: `Will anybody be able to see my private statistics?`,
    answer: `No. The private statistics are fetched via the Chrome extension, to ensure the statistics belong to the logged in user on Substack.
    <br/><br/>
    So unless someone has your credentials, they will not be able to see your private statistics.
    `,
  },
  {
    question: "Do you use my paid articles?",
    answer: `No. We do not show, use or give access to your paid articles to anyone.`,
  },
  {
    question: `Can I schedule if I have Firefox or Safari?`,
    answer: `The extension is only available for Chrome, Brave, Opera, Arc and any Chromium-based browser. 
    <br/><br/>
    But you can schedule through Chrome and just minimize it and use your favorite browser.`,
  },
  {
    question: `I don't get it. Are you recommending I copy other people's notes?`,
    answer: `No. Definitely not. Not only is this something you shouldn't do, it also won't work.
    <br/><br/>
    Perhaps in the short term you'll get a little bit more engagement, but you are bound to be called out for it at some point and lose credibility.
    <br/><br/>
    It also goes against Substack's Policy to be purposefully creating identical or near-identical content repeatedly.
    <br/><br/>
    What we believe is it's perfectly fine and an effective process to consume amazing content that helps you come up with your own authentic ideas and content.
    <br/>
    It's what everyone does, in just about every field and line of work. Artists learn and get inspiration from artists before them. So do athletes. Scientists. Designers. And so does everyone on Substack.
    <br/><br/>
    What's not OK is to take people's content and claim it as your own.`,
  },
  {
    question: `Can I tell WriteStack's AI on which topic I want to generate notes?`,
    answer: `Absolutely! You can tell WriteStack's AI on which topic you want to generate notes and it will generate 3 unique and original notes for you.`,
  },
  {
    question: `Can I specify the outline and let ${appName} work with it for my articles?`,
    answer: `Yes! Create a new, empty draft, fill up your outline and ask the AI to elaborate on it.`,
  },
  {
    question: `Can I train the model with my own description?`,
    answer: `Yes! In the settings you can write your own description and even the topics you want to write about.`,
  },
  {
    question: `Can I cancel anytime?`,
    answer: `Yes. No contracts, no tricks.`,
  },
  {
    question: "I have a question. What do I do?",
    answer: `Oh, I love questions. Hit me up on <a href="https://substack.com/@orelzilberman" target="_blank" class="underline text-primary">Substack</a>`,
  },
];

function App() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    import("locomotive-scroll").then(({ default: LocomotiveScroll }) => {
      const scrollEl = document.querySelector("[data-scroll-container]");
      if (!scrollEl) return;

      const scroll = new LocomotiveScroll({
        el: scrollEl as HTMLElement,
        smooth: true,
        multiplier: 0.75,
        lerp: 0.05,
      });

      document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener("click", function (this: HTMLAnchorElement, e) {
          e.preventDefault();
          const href = this.getAttribute("href");
          if (href) {
            const target = document.querySelector(href);
            if (target instanceof HTMLElement) scroll.scrollTo(target);
          }
        });
      });

      return () => {
        scroll.destroy();
      };
    });
  }, []);

  return (
    <div
      className="w-full overflow-x-hidden bg-primary"
      data-scroll-container
    >
      <ThemeProvider forcedTheme="light">
        <Header />
        <HeroSection />
        <DividerPrimary>
          <UsedByTopCreators />
        </DividerPrimary>
        {/* Social Proof Banner */}
        <OtherSolutions />
        <DividerPrimary className="flex-col gap-10">
          <h2 className="text-center text-primary-foreground text-3xl lg:text-[56px] lg:leading-[4rem] font-bold">
            <span className="text-orange-950">Discover</span> how {appName} will
            help you
            <br /> <AnimatedHighlight>grow your community</AnimatedHighlight>
            <br /> 5x faster.
          </h2>
          <Button
            variant={"outline"}
            className="text-xl lg:text-2xl p-6 lg:p-8"
            asChild
          >
            <Link href="/login">
              Start growing now <ArrowRight className="ml-2 mt-1" />
            </Link>
          </Button>
        </DividerPrimary>

        {/* Features Section */}
        <ProductHighlightSection />
        <DividerPrimary>
          <h2 className="text-center text-primary-foreground text-3xl lg:text-[56px] lg:leading-[4rem] font-bold">
            <span className="text-orange-950">Writing notes</span> is the best
            way
            <br /> to grow on Substack
            <AnimatedHighlight>FAST</AnimatedHighlight>
          </h2>
        </DividerPrimary>
        <WhyNotesSection />
        <DividerPrimary>
          <h2 className="text-center text-primary-foreground text-3xl lg:text-[56px] lg:leading-[4rem] font-bold">
            <span className="text-orange-950">Go deeper</span> into your notes.
            <br /> There are{" "}
            <AnimatedHighlight>stats to explore</AnimatedHighlight>
          </h2>
        </DividerPrimary>
        <FeaturesSection />
        {/* Testimonials Section */}
        <DividerPrimary>
          <div className="container mx-auto py-4 lg:py-24">
            <h2 className="text-center text-primary-foreground text-3xl lg:text-[56px] lg:leading-[4rem] font-bold mb-12">
              <span className="text-orange-950">
                Meet the writers who grew with {appName}
              </span>
            </h2>
            <MasonryGrid
              cards={testimonials.map((testimonial, index) => ({
                id: index,
                content: (
                  <div
                    className={cn(
                      "p-6 flex flex-col gap-4 shadow-lg overflow-visible",
                      {
                        "z-50": !!testimonial.noteImage,
                      },
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <img
                        src={testimonial.image}
                        alt={testimonial.author}
                        className="w-10 h-10 rounded-full"
                      />
                      <div>
                        <div className="flex flex-row items-center gap-1">
                          <div className="font-semibold hover:underline hover:cursor-pointer">
                            <Link href={testimonial.url} target="_blank">
                              {testimonial.author}
                            </Link>
                          </div>
                          {testimonial.bestSeller &&
                            (testimonial.bestSeller === "100" ? (
                              <BestSeller100 height={16} width={16} />
                            ) : testimonial.bestSeller === "1000" ? (
                              <BestSeller1000 height={16} width={16} />
                            ) : (
                              <BestSeller10000 height={16} width={16} />
                            ))}
                        </div>

                        <div
                          className="text-sm text-muted-foreground"
                          dangerouslySetInnerHTML={{
                            __html: testimonial.title,
                          }}
                        />
                      </div>
                    </div>
                    {testimonial.quote && (
                      <p
                        className="text-foreground mb-4"
                        dangerouslySetInnerHTML={{
                          __html: testimonial.quote,
                        }}
                      />
                    )}
                    {testimonial.noteImage && (
                      <motion.img
                        whileHover={{
                          scale: 1.6,
                          // make it incraese size to the left side
                          x: -40,
                        }}
                        transition={{ duration: 0.3 }}
                        src={testimonial.noteImage}
                        alt={testimonial.author}
                        onClick={() => {
                          if (testimonial.noteUrl) {
                            window.open(testimonial.noteUrl, "_blank");
                          }
                        }}
                        className={cn(
                          "w-full h-40 object-cover rounded-lg hover:border hover:border-foreground/20 hover:shadow-md transition-shadow duration-300",
                          {
                            "cursor-pointer": !!testimonial.noteUrl,
                          },
                        )}
                      />
                    )}
                  </div>
                ),
                className: "bg-card rounded-lg shadow-lg",
              }))}
              columns={3}
              gap={8}
            />
          </div>
        </DividerPrimary>

        {/* Pricing Section */}
        <Pricing className="bg-background" />

        {/* FAQ Section */}
        <motion.section
          id="faq"
          className="bg-muted px-6 md:px-0 flex justify-center items-center"
        >
          <div className="landing-section-container">
            <div className="max-w-3xl mx-auto px-4">
              <div className="text-center mb-16">
                <h2>Frequently Asked Questions</h2>
                <p>Based on actual users feedback</p>
              </div>
              <Accordion type="single" collapsible className="space-y-4">
                {faq.map((item, index) => (
                  <AccordionItem key={index} value={`item-${index}`}>
                    <AccordionTrigger>{item.question}</AccordionTrigger>
                    <AccordionContent>
                      <div
                        dangerouslySetInnerHTML={{
                          __html: item.answer,
                        }}
                      />
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </motion.section>

        {/* Final CTA */}
        <section className="w-full h-fit bg-background">
          <div className="py-20 bg-gradient-to-r from-background to-muted-foreground/10">
            <div className="max-w-5xl mx-auto px-4 text-center">
              <h2 className="text-4xl font-bold mb-6">
                Write Better. Grow Your Audience.Get Closer to <br />
                <span className="text-primary">
                  Financial & Creative Freedom.
                </span>
              </h2>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" asChild>
                  <Link href="/login">Try It For Free</Link>
                </Button>
              </div>
            </div>
            <div className="text-center text-foreground text-sm mt-6">
              <p>
                Need help?{" "}
                <a
                  href="mailto:orelsmail@gmail.com"
                  className="underline text-primary"
                >
                  Contact me
                </a>
              </p>
            </div>
          </div>
          <span className="w-full h-full flex justify-center items-center text-center text-xs text-muted-foreground z-[50] bg-muted pb-2">
            This website was made by Substack creators for Substack creators,
            but not YET affiliated with Substack.
          </span>
        </section>
      </ThemeProvider>
    </div>
  );
}

export default App;
