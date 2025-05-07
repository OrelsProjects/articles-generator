"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { ImprovementType } from "@/lib/prompts";
import { formatText, textEditorOptions } from "@/lib/utils/text-editor";
import { EditorContent, useEditor } from "@tiptap/react";
import { ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { initialTextForEnhancement, textByType } from "@/lib/landing-consts";
import { appName } from "@/lib/consts";
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

type ImprovementTone = "Funny" | "Creative" | "Engaging" | "Sarcastic";

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

const faq = [
  {
    question: `Do I need to leave my computer running to schedule notes?`,
    answer: `Yes. Just leave the ${appName}'s window in the background and it will automatically publish your notes at anytime you choose!`,
  },
  {
    question: `What if I forgot to leave ${appName} running?`,
    answer: `No problem! You will get an email with a button to one-click publish the missing note.`,
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
];

function App() {
  return (
    <div className="min-h-screen w-screen overflow-x-hidden bg-primary">
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
            <br />{" "}
            <span className="bg-orange-400 rounded-lg px-4">
              {" "}
              grow your community
            </span>
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
            <span className="bg-orange-400 rounded-lg px-4">FAST</span>
          </h2>
        </DividerPrimary>
        <WhyNotesSection />
        <DividerPrimary>
          <h2 className="text-center text-primary-foreground text-3xl lg:text-[56px] lg:leading-[4rem] font-bold">
            <span className="text-orange-950">Go beyond</span> notes
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
                  <div className="p-6 flex flex-col gap-4 shadow-lg">
                    <div className="flex items-center gap-2">
                      <img
                        src={testimonial.image}
                        alt={testimonial.author}
                        className="w-10 h-10 rounded-full"
                      />
                      <div>
                        <div className="font-semibold">
                          {testimonial.author}
                        </div>
                        <div
                          className="text-sm text-muted-foreground"
                          dangerouslySetInnerHTML={{
                            __html: testimonial.title,
                          }}
                        />
                      </div>
                    </div>
                    <p
                      className="text-foreground mb-4"
                      dangerouslySetInnerHTML={{
                        __html: testimonial.quote,
                      }}
                    />
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
                    <AccordionContent>{item.answer}</AccordionContent>
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
                  contact me
                </a>
              </p>
            </div>
          </div>
          <span className="w-full h-full flex justify-center items-center text-center text-xs text-muted-foreground z-[50] bg-muted pb-2">
            This website is not affiliated or partnered with Substack.
          </span>
        </section>
      </ThemeProvider>
    </div>
  );
}

const testimonials = [
  {
    quote: `I found ${appName} via Substack.

    It's a great product and easy to use. It takes all the best features of other scheduling apps and puts them in one place.
    <br/><br/>
    Right now it's the only Substack scheduler there is. The team works hard on it and I would recommend to anyone who wants to take Substack seriously.
    <br/><br/>
    Seeing top posts is a gamechanger as well.
    <br/><br/>
    Effortless to get started. I recommend you start with the "queue" page
    `,
    author: "Tim Denning",
    image: "/tim-denning.jpg",
    title:
      "Author of Unfiltered by Tim Denning<br/>(<strong>141k+ Subscribers</strong>)",
  },
  {
    quote: `WriteStack is my go-to tool for figuring out what’s working on Substack—and what isn’t. 
    <br/><br/>
    It saves me hours of research and helps me stay ahead of the curve.
    <br/><br/>
    Orel has really helpful and always looking to improve WriteStack.
`,
    author: "Philip Hofmacher",
    image:
      "https://substackcdn.com/image/fetch/f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2Fdc125fa8-cfe4-438f-9b30-375d783f944b_865x865.jpeg",
    title:
      "Author of Write Build Scale<br/>(<strong>10k+ Subscribers</strong>)",
  },
  {
    quote: `${appName} is an amazing tool for any Substack writers who want to take some of the pain out of growing on the platform.
   <br/><br/>
   It's easy to use, very intuative and constantly improving.
   <br/>If you want to build a Substack audience on a daily basis without the hassle (and have fun in the process), you need to try ${appName}.
   <br/><br/>
   <strong>Highly recommended!</strong>
`,
    author: "David McIlroy",
    image: "/testimonials/david-mcilroy.jpg",
    title:
      "Writer of How to Write for a Living<br/>(<strong>22k+ subscribers</strong>)",
  },

  {
    quote: `${appName} allowed me to finally find my voice on Substack Notes, one that I'm satisfied with and I feel like. 
      <br/><br/> It resonates with readers.
      <br/><br/> It's also extremely easy to use, so it lets me post multiple notes a day, even if I have little to no time`,
    author: "Kacper Wojaczek",
    image: "/testimonials/kacper-wojaczek.png",
    title: "Author of Scramble IT",
  },
  {
    quote: `WriteStack transformed my experience on Notes with its scheduling tools.
<br/><br/>
It's easy to use, and Orel is exceptionally fast at responding to issues.
<br/><br/>
Since using WriteStack, I've seen consistent growth in engagement, and have actually enjoyed the process of planning my content calendar.
<br/><br/>
<strong>Recommended for any serious Notes creator!</strong>`,
    author: "Rasmus Edwards",
    image: "/testimonials/rasmus-edwards.webp",
    title: "Author of the Solo Dev Saturday",
  },
  {
    quote: `I love ${appName}.
    <br/><br/>
    I've been using it to get inspiration for my Substack Notes and it saves me so much time coming up with new ideas.
    <br/><br/>
     I <strong>highly recommend</strong> it to anyone writing daily on Substack.`,
    author: "Mark Willis",
    image: "/testimonials/mark-willis.png",
    title: "Author of Creator's Playbook",
  },
  {
    quote: `Writing a newsletter outline used to take me hours. Now I do it in minutes.
  ${appName} makes that possible for me.
<br/><br/>
I can generate new article outlines in minutes,
and the exciting part is the AI assistant that helps me using my exact writing style.
<br/><br/>
And what I like about it is just how easy it is to copy and paste the results into my substack writer tool.`,
    author: "MacDaniel Chimedza",
    image: "/testimonials/macdaniel-chimedza.png",
    title: "Author of The Weekly Mindset",
  },
];

export default App;
