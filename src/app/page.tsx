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
import {
  BrainCircuit,
  Edit3,
  FileEdit,
  Lightbulb,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, Variants } from "framer-motion";
import { Product } from "@/types/payment";
import { initialTextForEnhancement, textByType } from "@/lib/landing-consts";
import { appName } from "@/lib/consts";
import { useCustomRouter } from "@/lib/hooks/useCustomRouter";
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

const DividerPrimary = ({ children }: { children: React.ReactNode }) => (
  <div className="w-full h-fit md:min-h-[400px] bg-primary flex justify-center items-center">
    {children}
  </div>
);

const EnhancmentDemo = () => {
  const [loadingTone, setLoadingTone] = useState<ImprovementType | null>(null);
  const [text, setText] = useState(initialTextForEnhancement);
  const [selectedTone, setSelectedTone] = useState<ImprovementTone | null>(
    null,
  );
  const editor = useEditor(textEditorOptions(undefined, undefined, true));

  useEffect(() => {
    const formattedBody = formatText(text);
    editor?.commands.setContent(formattedBody);
  }, [editor, text]);

  const handleImprovement = async (type: ImprovementTone) => {
    setLoadingTone(type);
    setText(textByType[type]);
    setSelectedTone(type);
    setLoadingTone(null);
  };

  return (
    <div className={cn("flex flex-col gap-4")}>
      <EditorContent
        editor={editor}
        value={text}
        disabled
        className={cn("pb-0", {
          "pb-7": text === initialTextForEnhancement,
        })}
      />
      <div className="flex gap-2 flex-wrap">
        <div className="flex gap-2 flex-wrap"></div>
        {["Funny", "Creative", "Engaging", "Sarcastic"].map(tone => (
          <Button
            key={tone}
            variant={selectedTone == tone ? "default" : "outline"}
            className="hover:bg-primary hover:text-primary-foreground transition-colors"
            disabled={loadingTone !== null}
            onClick={() => handleImprovement(tone as ImprovementTone)}
          >
            {loadingTone == tone && (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            )}
            {tone}
          </Button>
        ))}
      </div>
    </div>
  );
};

// Define animation variants
const gentleFadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
};

const gentleFadeInTransition = {
  transition: { duration: 1.2, ease: "easeOut" },
};

const faq = [
  {
    question: `Can I specify the outline and let ${appName} work with it?`,
    answer: `Yes! Create a new, empty draft, fill up your outline and ask the AI to elaborate on it.`,
  },
  {
    question: `Can I train the model with my own description?`,
    answer: `Yes! In the settings you can write your own description and even the topics you want to write about.`,
  },
  {
    question: `Does ${appName} write for me?`,
    answer: `No! ${appName} enhances your writing, but you are always in control. We provide tools and suggestions to improve your newsletter while maintaining your unique voice.`,
  },
  {
    question: `Is this just another AI ghostwriter?`,
    answer: `No! ${appName} provides research, structure, and enhancement
    tools—not AI-generated newsletters. We believe in augmenting human
    creativity, not replacing it.`,
  },
  {
    question: `Can I cancel anytime?`,
    answer: `Yes. No contracts, no tricks—just smarter writing. You can cancel your subscription at any time with no questions asked.`,
  },
];

function App() {
  const router = useCustomRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [fetchingProducts, setFetchingProducts] = useState(false);
  const [didFetchProducts, setDidFetchProducts] = useState(false);

  useEffect(() => {
    if (didFetchProducts) return;
    if (products.length > 0 || fetchingProducts) return;
    setFetchingProducts(true);
    fetch("/api/stripe/products")
      .then(res => res.json())
      .then(data => setProducts(data.products || []))
      .catch(err => {
        console.log(err);
        setProducts([]);
      })
      .finally(() => {
        setFetchingProducts(false);
        setDidFetchProducts(true);
      });
  }, [fetchingProducts, products, didFetchProducts]);

  return (
    <div className="min-h-screen w-screen overflow-x-hidden bg-primary">
      <ThemeProvider forcedTheme="light">
        <Header />
        <HeroSection />
        <DividerPrimary>
          <UsedByTopCreators />
        </DividerPrimary>
        {/* Social Proof Banner */}
        {/* <motion.section
        className="py-6 bg-primary/10"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        viewport={{ once: true }}
      >
        <div className="container mx-auto px-4 text-center">
          <p className="text-lg font-medium">
            <span className="font-bold">1,000+ Substack writers</span> with <span className="font-bold">20+ published newsletters</span> trust {appName}
          </p>
          <div className="flex justify-center gap-8 mt-4">
            <div className="flex items-center">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-8 h-8 rounded-full bg-primary/20 border-2 border-background flex items-center justify-center text-xs font-bold">
                    {i}
                  </div>
                ))}
              </div>
              <span className="ml-2 text-sm font-medium">Earning $1k+/month</span>
            </div>
            <div className="flex items-center">
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((i) => (
                  <svg key={i} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
                <span className="ml-1 text-sm font-medium">4.9/5 (87 reviews)</span>
              </div>
            </div>
          </div>
        </div>
      </motion.section> */}
        <OtherSolutions />
        <DividerPrimary>
          <h2 className="text-center text-primary-foreground text-[56px] leading-[4rem] font-bold">
            <span className="text-orange-950">Discover</span> how {appName} will
            help you
            <br />{" "}
            <span className="bg-orange-400 rounded-lg px-4">
              {" "}
              grow your community
            </span>
            <br /> faster than ever before.
          </h2>
        </DividerPrimary>

        {/* Features Section */}
        <ProductHighlightSection />
        <DividerPrimary>
          <h2 className="text-center text-primary-foreground text-[56px] leading-[4rem] font-bold">
            <span className="text-orange-950">Writing notes</span> is the best
            way
            <br /> to grow on Substack
            <span className="bg-orange-400 rounded-lg px-4">FAST</span>
          </h2>
        </DividerPrimary>
        <WhyNotesSection />
        <FeaturesSection />
        {/* Testimonials Section */}
        <motion.section
          className="landing-section-container bg-muted p-24"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          viewport={{ once: true }}
        >
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-6">
              Writers Love {appName}—Here&apos;s Why
            </h2>
            <p className="text-xl text-center text-muted-foreground mb-16 max-w-3xl mx-auto">
              Join successful Substack writers who are growing their audience
              and income with {appName}
            </p>
            <MasonryGrid
              cards={testimonials.map((testimonial, index) => ({
                id: index,
                content: (
                  <div className="p-6">
                    <div className="flex items-center mb-4">
                      {[1, 2, 3, 4, 5].map(i => (
                        <svg
                          key={i}
                          className="w-5 h-5 text-yellow-400"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <p
                      className="text-muted-foreground mb-4"
                      dangerouslySetInnerHTML={{
                        __html: testimonial.quote,
                      }}
                    />
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
                        <div className="text-sm text-muted-foreground">
                          {testimonial.title}
                        </div>
                      </div>
                    </div>
                  </div>
                ),
                className: "bg-card rounded-lg shadow-sm",
              }))}
              columns={3}
              gap={8}
            />
          </div>
        </motion.section>

        {/* Pricing Section */}
        <Pricing className="bg-background" />

        {/* FAQ Section */}
        <motion.section
          id="faq"
          className="py-20 bg-muted"
          variants={gentleFadeIn}
          {...gentleFadeInTransition}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
        >
          <div className="max-w-3xl mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl text-center font-bold tracking-tight text-foreground sm:text-5xl mb-4">
                Frequently Asked Questions
              </h2>
              <p className="text-muted-foreground/80 text-center text-2xl font-normal">
                (Based on actual users feedback)
              </p>
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
        </motion.section>

        {/* Final CTA */}
        <section className="w-full h-fit bg-background">
          <div className="py-20 bg-gradient-to-r from-background to-muted-foreground/10">
            <div className="max-w-5xl mx-auto px-4 text-center">
              <h2 className="text-4xl font-bold mb-6">
                Write Better. Grow Your Audience.{" "}
                <span className="text-primary">Increase Your Income.</span>
              </h2>
              <p className="text-xl mb-8 opacity-90">
                Join 1,000+ Substack writers earning $1k+/month with {appName}
                &apos;s fully-integrated AI assistant.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="outline" size="lg" asChild>
                  <Link href="/login">Try It Free</Link>
                </Button>
                <Button size="lg" variant="default" asChild>
                  <Link href="#pricing">Upgrade to Pro</Link>
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
        </section>
      </ThemeProvider>
    </div>
  );
}
const painPoints = [
  {
    icon: <Lightbulb className="h-8 w-8 text-primary" />,
    problem: "I never know what to write next in my newsletter.",
    problemDetails:
      "You've got zero direction, no coherent theme, and every new issue feels like you're starting from scratch.",
  },
  {
    icon: <BrainCircuit className="h-8 w-8 text-primary" />,
    problem:
      "I want to refine my writing, but AI tools feel disconnected from Substack.",
    problemDetails:
      "Constantly switching between ChatGPT and Substack breaks your flow and wastes valuable time.",
  },
  {
    icon: <FileEdit className="h-8 w-8 text-primary" />,
    problem: "I waste too much time structuring my newsletters.",
    problemDetails:
      "You're stuck mapping outlines and reorganizing paragraphs instead of growing your audience and income.",
  },
];

const steps = [
  {
    title: "AI-Powered newsletter idea generation",
    description:
      "Get title, subtitle & outline ideas based on 5M+ high-performing Substack newsletters.",
    visual: (
      <div className="space-y-2">
        <div className="h-8 bg-muted rounded animate-pulse" />
        <div className="h-8 bg-muted rounded animate-pulse" />
        <div className="h-8 bg-muted rounded animate-pulse" />
      </div>
    ),
  },
  {
    title: "Smart newsletter editing & enhancements",
    description: `Expand ideas, refine tone, and improve clarity—all in one clean editor that integrates directly with Substack.<br/>
      And the best part? The AI will not add any text. Only refine what's already there.
      `,
    visual: <EnhancmentDemo />,
  },
  {
    title: "Publish directly to Substack",
    description:
      "One-click publishing to Substack so you can focus on what matters—growing your audience and income.",
    visual: (
      <div className="relative">
        <Edit3 className="h-12 w-12 text-primary mx-auto" />
      </div>
    ),
  },
];

const testimonials = [
  {
    // quote: `${appName} helps me plan Substack newsletters faster than ever, growing my subscriber base by 32% in just 3 months.`,
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
  {
    quote: `WriteRoom allowed me to finally find my voice on Substack Notes, one that I'm satisfied with and I feel like. 
      <br/><br/> It resonates with readers.
      <br/><br/> It's also extremely easy to use, so it lets me post multiple notes a day, even if I have little to no time`,
    author: "Kacper Wojaczek",
    image: "/testimonials/kacper-wojaczek.png",
    title: "Author of Scramble IT",
  },
  {
    quote:
      "This tool is a must-have for serious Substack writers with 20+ posts who want to scale their income.",
    author: "Mark T.",
    title: "Newsletter Writer, $3.5K/month",
  },
];

const footerLinks = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "#" },
      { label: "Pricing", href: "#" },
      { label: "Use Cases", href: "#" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Blog", href: "#" },
      { label: "Documentation", href: "#" },
      { label: "Tutorials", href: "#" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "#" },
      { label: "Contact", href: "#" },
      { label: "Privacy", href: "#" },
    ],
  },
];

export default App;
