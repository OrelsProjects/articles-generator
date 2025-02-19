"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ImprovementType } from "@/lib/prompts";
import { formatText, textEditorOptions } from "@/lib/utils/text-editor";
import { EditorContent, useEditor } from "@tiptap/react";
import {
  ArrowRight,
  BrainCircuit,
  Check,
  Edit3,
  FileEdit,
  Lightbulb,
  Loader2,
  Pencil,
  Plus,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, Variants } from "framer-motion";
import { Product } from "@/types/payment";
import {
  maxIdeasPerPlan,
  maxTextEnhancmentsPerPlan,
  maxTitleAndSubtitleRefinementsPerPlan,
  textEditorTypePerPlan,
} from "@/lib/plans-consts";
import { BackgroundGradient } from "@/components/ui/background-gradient";
import { initialTextForEnhancement, textByType } from "@/lib/landing-consts";
import { appName } from "@/lib/consts";
import { useCustomRouter } from "@/lib/hooks/useCustomRouter";

type ImprovementTone = "Funny" | "Creative" | "Engaging" | "Sarcastic";

const EnhancmentDemo = () => {
  const router = useCustomRouter();
  const [loadingTone, setLoadingTone] = useState<ImprovementType | null>(null);
  const [text, setText] = useState(initialTextForEnhancement);
  const [selectedTone, setSelectedTone] = useState<ImprovementTone | null>(
    null,
  );
  const editor = useEditor(textEditorOptions(undefined, true));

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
    <div className="flex flex-col gap-4">
      <EditorContent editor={editor} value={text} disabled />
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

const fadeInUp: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

const fadeInUpTransition = { transition: { duration: 0.8, ease: "easeOut" } };

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

  const handleGetStarted = (productId: string, priceId: string) => {
    router.push(`/login?pri_id=${priceId}&pro_id=${productId}`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="section-padding min-h-screen flex flex-col justify-center items-center text-center relative">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/0 to-transparent" />
        <div className="container relative space-y-8">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 3.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary/5 text-primary border border-primary/20 rounded-full"
          >
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">
              AI-Powered article editor
            </span>
          </motion.div>
          <h1 className="h1 max-w-3xl mx-auto text-6xl">
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, delay: 0, ease: "easeOut" }}
              className="relative"
            >
              Write better.
            </motion.span>
            <motion.span
              {...fadeInUp}
              transition={{
                ...fadeInUpTransition,
                duration: 1,
                delay: 1,
                ease: "easeOut",
              }}
              className="relative"
            >
              {/* Underline */}
              <motion.span
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{
                  duration: 0.75,
                  delay: 1.4,
                  ease: "easeOut",
                }}
                className="absolute inset-x-0 bottom-2 h-3 bg-primary/10 -rotate-2"
              />
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.75, delay: 1, ease: "easeOut" }}
                className="relative"
              >
                Stay human.
              </motion.span>
            </motion.span>
            <motion.span
              {...fadeInUp}
              transition={{ duration: 0.75, delay: 2.25, ease: "easeOut" }}
              className="text-primary"
            >
              Let AI assist.
            </motion.span>
          </h1>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 4 }}
            className="flex flex-col gap-4"
          >
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              The AI-powered text editor that helps you generate ideas,
              structure content, and refine your writing—without replacing your
              voice.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" asChild>
                <Link href="/login">
                  Try {appName} for Free
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button variant="outline" size="lg">
                See How It Works
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pain Points Section */}
      <section className="py-20 bg-muted">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
            Why writing consistently feels hard
            <br />
            <span className="text-muted-foreground/80 text-2xl font-normal">
              (And how {appName} fixes it)
            </span>
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {painPoints.map((point, index) => (
              <Card
                key={index}
                className="p-6 hover:shadow-lg transition-shadow"
              >
                <div className="mb-4">{point.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{point.problem}</h3>
                <p className="text-muted-foreground">{point.solution}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gradient-to-b from-background to-muted">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
            How {appName} helps you write smarter
            <br />
            <span className="text-muted-foreground/80 text-2xl font-normal">
              (Without taking over)
            </span>
          </h2>

          <div className="space-y-16">
            {steps.map((step, index) => (
              <div
                key={index}
                className="flex flex-col md:flex-row items-center gap-8"
              >
                <div className="flex-1">
                  <div className="text-primary text-lg font-semibold mb-2">
                    Step {index + 1}
                  </div>
                  <h3 className="text-2xl font-bold mb-4">{step.title}</h3>
                  <p
                    className="text-muted-foreground"
                    dangerouslySetInnerHTML={{
                      __html: step.description,
                    }}
                  />
                </div>
                <div className="flex-1">
                  <Card className="p-6">{step.visual}</Card>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <motion.section
        className="py-20 bg-muted"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        viewport={{ once: true }}
      >
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
            Writers Love {appName}—Here&apos;s Why
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="p-6">
                <div className="flex items-start mb-4">
                  <div className="bg-primary rounded-full p-2">
                    <Pencil className="h-4 w-4 text-primary-foreground" />
                  </div>
                </div>
                <p className="text-muted-foreground mb-4">
                  {testimonial.quote}
                </p>
                <div>
                  <div className="font-semibold">{testimonial.author}</div>
                  <div className="text-sm text-muted-foreground">
                    {testimonial.title}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Pricing Section */}
      <motion.section
        id="pricing"
        className="py-20 bg-muted"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        viewport={{ once: true }}
      >
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12">
            Write smarter with {appName}+
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {/* Free Plan */}
            <Card className="hover:shadow-lg transition-shadow duration-300 relative flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Free Plan</span>
                  <span className="text-2xl font-bold">$0</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="h-full flex flex-col justify-between">
                <ul className="space-y-4">
                  <li className="flex items-center">
                    <Check className="text-green-500 mr-2" size={16} />
                    <span>{textEditorTypePerPlan.free} text editor access</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="text-green-500 mr-2" size={16} />
                    <span>
                      {maxIdeasPerPlan.free} AI-powered idea generations/day
                    </span>
                  </li>
                  <li className="flex items-center">
                    <Check className="text-green-500 mr-2" size={16} />
                    <span>
                      {maxTitleAndSubtitleRefinementsPerPlan.free} title &
                      subtitle refinements/day
                    </span>
                  </li>
                  <li className="flex items-center">
                    <Check className="text-green-500 mr-2" size={16} />
                    <span>
                      {maxTextEnhancmentsPerPlan.free} text enhancements/day
                    </span>
                  </li>
                </ul>
                <Button className="w-full mt-6" variant="outline" asChild>
                  <Link href="/login">Start Free</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Pro Monthly */}
            {products.map(product => (
              <>
                <Card className="hover:shadow-lg transition-shadow duration-300 relative flex flex-col">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{product.name}</span>
                      <span className="text-2xl font-bold">
                        ${product.priceStructure.monthly.priceFormatted}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="h-full flex flex-col justify-between">
                    <ul className="space-y-4 mb-6">
                      {product.features.map(feature => (
                        <li
                          className="flex items-center"
                          key={`${feature}-monthly`}
                        >
                          <Check className="text-green-500 mr-2" size={16} />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      variant="outline"
                      onClick={() =>
                        handleGetStarted(
                          product.id,
                          product.priceStructure.monthly.id,
                        )
                      }
                    >
                      Get Pro Monthly
                    </Button>
                  </CardContent>
                </Card>

                {/* Pro Yearly */}
                <BackgroundGradient className="rounded-xl p-0">
                  <Card className="relative flex flex-col shadow-none border-none">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>{product.name} Yearly</span>
                        <div className="text-right relative">
                          <span className="text-2xl font-bold">
                            ${product.priceStructure.yearly.priceFormatted}
                          </span>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="h-full flex flex-col justify-between">
                      <ul className="space-y-4 mb-6">
                        {product.features.map(feature => (
                          <li
                            className="flex items-center"
                            key={`${feature}-yearly`}
                          >
                            <Check className="text-green-500 mr-2" size={16} />
                            <span>{feature}</span>
                          </li>
                        ))}
                        <li className="flex items-center text-primary">
                          <Plus className="text-primary mr-2" size={16} />
                          <span>Extra 15 AI-powered ideas/day</span>
                        </li>
                        <li className="flex items-center text-primary">
                          <Plus className="text-primary mr-2" size={16} />
                          <span>Same price-forever</span>
                        </li>
                        <li className="flex items-center text-primary font-semibold">
                          <Plus className="text-primary mr-2" size={16} />
                          <span>Save 36%</span>
                        </li>
                      </ul>
                      <Button
                        className="w-full mt-6"
                        variant="default"
                        onClick={() =>
                          handleGetStarted(
                            product.id,
                            product.priceStructure.yearly.id,
                          )
                        }
                      >
                        Get Pro Yearly
                      </Button>
                    </CardContent>
                  </Card>
                </BackgroundGradient>
              </>
            ))}
          </div>
        </div>
      </motion.section>

      {/* FAQ Section */}
      <motion.section
        className="py-20 bg-muted"
        variants={gentleFadeIn}
        {...gentleFadeInTransition}
        initial="initial"
        whileInView="animate"
        viewport={{ once: true }}
      >
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center text-muted-foreground mb-12">
            Frequently Asked Questions
          </h2>
          <Accordion type="single" collapsible className="space-y-4">
            <AccordionItem value="item-1">
              <AccordionTrigger>Does {appName} write for me?</AccordionTrigger>
              <AccordionContent>
                No! {appName} enhances your writing, but you are always in
                control. We provide tools and suggestions to improve your
                writing while maintaining your unique voice.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2">
              <AccordionTrigger>
                Is this just another AI ghostwriter?
              </AccordionTrigger>
              <AccordionContent>
                No! {appName} provides research, structure, and enhancement
                tools—not AI-generated articles. We believe in augmenting human
                creativity, not replacing it.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3">
              <AccordionTrigger>Can I cancel anytime?</AccordionTrigger>
              <AccordionContent>
                Yes. No contracts, no tricks—just smarter writing. You can
                cancel your subscription at any time with no questions asked.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </motion.section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-r from-background to-muted-foreground/10">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">
            Write Better. Stay Human.{" "}
            <span className="text-primary">Let AI assist.</span>
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Smarter writing, structured ideas, and a clutter-free workspace—all
            in your control. Join 1,000+ writers using {appName} today.
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
      </section>
    </div>
  );
}

const painPoints = [
  {
    icon: <Lightbulb className="h-8 w-8 text-primary" />,
    problem: "I never know what to write next, I run out of ideas.",
    solution:
      "AI-powered ideas generator keeps your creativity flowing at all times.",
  },
  {
    icon: <BrainCircuit className="h-8 w-8 text-primary" />,
    problem: "I want to refine my writing, but AI tools feel robotic.",
    solution: `${appName} suggests edits & enhances tone—without taking over.`,
  },
  {
    icon: <FileEdit className="h-8 w-8 text-primary" />,
    problem: "I waste too much time structuring my articles.",
    solution:
      "Generate instant outlines based on top-performing content in your niche.",
  },
];

const steps = [
  {
    title: "AI-Powered idea generation",
    description:
      "Get title, subtitle & outline ideas based on 5M+ high-performing articles.",
    visual: (
      <div className="space-y-2">
        <div className="h-8 bg-muted rounded animate-pulse" />
        <div className="h-8 bg-muted rounded animate-pulse" />
        <div className="h-8 bg-muted rounded animate-pulse" />
      </div>
    ),
  },
  {
    title: "Smart text editing & enhancements",
    description: `Expand ideas, refine tone, and improve clarity—all in one clean editor.<br/>
      And the best part? The AI will not add any text. Only refine what's already there.
      `,
    visual: <EnhancmentDemo />,
  },
  {
    title: "Publish with confidence",
    description:
      "A distraction-free, minimal UI so you can focus on what matters—your words.",
    visual: (
      <div className="relative">
        <Edit3 className="h-12 w-12 text-primary mx-auto" />
      </div>
    ),
  },
];

const testimonials = [
  {
    quote: `${appName} helps me plan Substack posts faster than ever.`,
    author: "Jessica L.",
    title: "8K subscribers",
  },
  {
    quote: "Finally, an AI tool that assists, not replaces my writing.",
    author: "David W.",
    title: "Tech Blogger",
  },
  {
    quote: "This tool is a must-have for serious content creators.",
    author: "Mark T.",
    title: "Newsletter Writer",
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
