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
    answer: `Yes. Just leave the ${appName}'s window in the background and it will automatically publish your notes at anytime you choose!`,
  },
  {
    question: `Do you use my draft notes?`,
    answer: `No. We never use your draft notes. We respect what you create and your drafts are private.`,
  },
  {
    question: "Do you use my paid articles?",
    answer: `No. We do not show, use or give access to your paid articles to anyone but you.`,
  },
  {
    question: `Can I schedule if I have Firefox or Safari?`,
    answer: `The extension is only available for Chrome. 
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
      className="w-screen overflow-x-hidden bg-primary"
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
    bestSeller: "100",
    author: "Tim Denning",
    image: "/tim-denning.jpg",
    title: "Author of Unfiltered by Tim Denning",
    url: "https://substack.com/@timdenning",
  },
  {
    noteImage: "/testimonials/anton-testimonial.png",
    noteUrl: "https://substack.com/@antonzaides/note/c-119174331",
    author: "Anton Zaides",
    title: "Author of Manager.dev",
    url: "https://substack.com/@antonzaides",
    image: "/testimonials/anton.webp",
  },
  {
    quote: `WriteStack is my go-to tool for figuring out what's working on Substack—and what isn't. 
    <br/><br/>
    It saves me hours of research and helps me stay ahead of the curve.
    <br/><br/>
    Orel has really helpful and always looking to improve WriteStack.
`,
    author: "Philip Hofmacher",
    bestSeller: "100",
    image:
      "https://substackcdn.com/image/fetch/f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2Fdc125fa8-cfe4-438f-9b30-375d783f944b_865x865.jpeg",
    title: "Author of Write Build Scale<br/>",
    url: "https://substack.com/@philiphofmacher",
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
    bestSeller: "100",
    image: "/testimonials/david-mcilroy.jpg",
    title: "Writer of How to Write for a Living<br/>",
    url: "https://substack.com/@thedavidmcilroy",
  },
  {
    quote: `${appName} allowed me to finally find my voice on Substack Notes, one that I'm satisfied with and I feel like. 
      <br/><br/> It resonates with readers.
      <br/><br/> It's also extremely easy to use, so it lets me post multiple notes a day, even if I have little to no time`,
    author: "Kacper Wojaczek",
    image: "/testimonials/kacper-wojaczek.png",
    title: "Author of Scramble IT",
    url: "https://substack.com/@kacperwojaczek",
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
    title: "Author of Solo Dev Saturday",
    url: "https://substack.com/@rasmusedwards",
  },
  {
    quote: `${appName} is incredibly thoughtful.
    <br/><br/>
    The notes scheduler keeps me consistent, and the outline generator is pure genius. 
    <br/><br/>
    It takes the pressure off starting from scratch and makes publishing feel easy.`,
    author: "Tam Nguyen",
    image: "/testimonials/tam-nguyen.jpg",
    title: "Author of Simply AI",
    url: "https://substack.com/@techwithtam",
  },
  {
    quote: `What makes Writestack stand out for me isn't just how deep the features go, it's that you can tell it's a product shaped by people who actually use it.
    <br/><br/>
    Using it feels more like a creative partnership than just a platform.`,
    author: "Karo (Product with Attitude)",
    image: "/testimonials/karo.png",
    title: "Author of Product with Attitude",
    url: "https://substack.com/@karozieminski",
  },
  {
    author: "Tech Tornado",
    quote: `WriteStack has been a game changer for me.
    <br/><br/>
    As a financial content creator, consistency is everything — and WriteStack helps me show up every day with clarity and structure.
    <br/><br/>
    I finally have a system to publish consistently without burning out.
    <br/><br/>
    — Felix, Founder of The Nasdaq Playbook`,
    image: "/testimonials/tech-tornado.webp",
    title: "Author of The Nasdaq Playbook",
    url: "https://substack.com/@techtornado",
  },
  {
    quote: `I found ${appName} right when my workflow was hitting a wall—too bogged down by my daily work, with too little time to post my content.
    <br/><br/>
    ${appName} instantly streamlined my process.
    <br/><br/>
    Scheduling and automation used to be a pain, but now I can queue up Substack Notes in advance and hit my audience at the perfect time, every day.
    <br/><br/>
    Since signing up, I'm posting more consistently, reaching more people, and spending way less time on manual busywork.
    <br/><br/>
    ${appName} has made my publishing life <strong>a lot easier</strong>.
    <br/><br/>
    Getting started with ${appName} was refreshingly simple.
    <br/><br/>
    Orel's customer service is next-level—he was on top of every detail and even fixed bugs before I noticed them. The onboarding just worked.
    <br/><br/>
    I'm so glad I found ${appName}.`,
    author: "Stefan G.",
    image: "/testimonials/stefan-girard.webp",
    title: "Author of Frontier Notes for AI Operators",
    url: "https://substack.com/@stfgirard",
  },
  {
    quote: `Writestack is not only the tool I was looking for to improve my presence on Substack, but it has also given me the opportunity to help members of my community grow theirs too.
        <br/><br/>
        Orel is doing an outstanding job democratizing growth on Substack. It's another step forward in giving creators more chances to share our message with the world.`,
    author: "David Domínguez",
    image: "/testimonials/david-dominguez.jpg",
    title: "Author of Crecer en Substack",
    url: "https://substack.com/@daviddominguez",
  },
  {
    noteImage: "/testimonials/alan-testimonial.png",
    noteUrl: "https://substack.com/@legendofalan/note/c-125360659",
    author: "Alan",
    image: "/testimonials/alan.jpg",
    title: "Author of the White Flag",
    url: "https://whiteflag1.substack.com/",
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
    url: "https://substack.com/@markwils",
  },
  {
    quote: `I had been looking for something to help me more consistent with posting Substack Notes as I recognized the importance for helping grow my brand.
    <br/><br/>
    What I found was not only a tool that could keep me consistent, but also offered tons of other features that allow me to focus on what I came to Substack for; to share ideas.
    <br/><br/>
    Orel has been totally responsive when I have small issues and appreciative of my questions regarding features. He even keeps adding things as we go.
    <br/><br/>
    Great product, great support, <strong>highly recommended!</strong>`,
    author: "Joe Mills",
    image: "/testimonials/joe-mills.jpg",
    title: "Author of Aligned Influence",
    url: "https://substack.com/@infolosophy",
  },
  {
    quote: `I’m loving the experience of reading and writing science fiction and connecting with a growing audience for my work on Substack.
    <br/><br/>
    WriteStack already helped me a lot in achieving that, even though I’ve only been using the tool for a few weeks.
    <br/><br/>
    It helped me organise, refine and publish my notes,  to find who might be interested in my work and equally to find authors whose work I’m interested in reading too!
    <br/><br/>
    For the metric lovers, here’s the before and after of my followship on Substack. I’m new to the platform but as you can see my audience is getting larger very quickly now.`,
    noteImage: "/testimonials/bruno-testimonial.png",
    author: "Bruno Martins",
    image: "/testimonials/bruno.webp",
    title: "Author of Dark Matter",
    url: "https://substack.com/@brunorothgiesser",
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
    url: "https://substack.com/@macdanielchimedza",
  },
];

export default App;
