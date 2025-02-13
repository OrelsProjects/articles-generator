"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Brain,
  Rocket,
  Zap,
  CheckCircle2,
  ArrowRight,
  PenTool,
  Lightbulb,
  ListTree,
  Edit,
  Target,
  Repeat,
  Check,
  HelpCircle,
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { CTASection } from "@/components/landing/cta-section";

const MotionCard = motion(Card);
const MotionButton = motion(Button);

// Slower, more subtle fade-in animation
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: "easeOut" },
  },
};

// Stagger children with a longer delay
const staggerChildren = {
  visible: {
    transition: {
      staggerChildren: 0.2,
    },
  },
};

// Improved animation for the hero's second line
const heroSecondLine = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 1.2,
      ease: "easeOut",
      delay: 0.5, // Delay the start of this animation
    },
  },
};

// Gentle pulse animation
const gentlePulse = {
  scale: [1, 1.05, 1],
  transition: { duration: 2, repeat: Infinity, ease: "easeInOut" },
};

const FAQ = () => {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center">
            <HelpCircle className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight">
            Frequently Asked Questions
          </h1>
          <p className="text-muted-foreground text-lg">
            Everything you need to know about our Substack integration
          </p>
        </div>

        <Card className="p-6">
          <Accordion type="single" collapsible className="space-y-4">
            <AccordionItem value="item-1" className="border-none">
              <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                How does the platform integrate with Substack?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Our platform seamlessly connects with your Substack account,
                allowing it to analyze your published newsletters. By examining
                your existing content, the AI generates personalized article
                ideas, titles, subtitles, and detailed outlines that align with
                your unique writing style and audience preferences.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2" className="border-none">
              <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                Will integrating with Substack affect my existing content?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                No, the integration is read-only. Our platform analyzes your
                content to provide tailored suggestions but does not modify or
                interfere with your existing Substack posts.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3" className="border-none">
              <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                How can this integration enhance my Substack newsletters?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                By leveraging AI-driven insights, you can overcome writer&apos;s
                block and maintain a consistent publishing schedule. The
                platform offers fresh perspectives and structured outlines,
                ensuring your newsletters remain engaging and relevant to your
                subscribers.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4" className="border-none">
              <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                Is my Substack data secure during integration?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Absolutely. We prioritize your privacy and data security. The
                platform accesses your Substack content solely to provide
                personalized suggestions and does not share your data with third
                parties.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5" className="border-none">
              <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                Can I customize the AI&apos;s suggestions to fit my
                Substack&apos;s tone?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Yes, the AI learns from your existing Substack content to tailor
                its suggestions to your specific tone and style, ensuring
                coherence with your established voice.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-6" className="border-none">
              <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                Do I need technical expertise to set up the Substack
                integration?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Not at all. The integration process is user-friendly, with clear
                instructions to guide you through connecting your Substack
                account to our platform effortlessly.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-7" className="border-none">
              <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                How does this integration differ from other AI writing tools?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Unlike generic AI tools, our platform offers a personalized
                experience by analyzing your specific Substack content. This
                ensures that the generated ideas and outlines are uniquely
                suited to your writing style and audience.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-8" className="border-none">
              <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                Is there a cost associated with the Substack integration?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                The integration is included in our standard subscription plans.
                Please refer to our pricing page for detailed information on
                available plans and features.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-9" className="border-none">
              <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                How do I provide feedback on the AI&apos;s suggestions?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                We value user feedback to improve our platform continually. You
                can provide feedback directly through the platform&apos;s
                interface or contact our support team with your insights and
                suggestions.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-10" className="border-none">
              <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                Where can I find support if I encounter issues with the
                integration?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Our dedicated support team is available to assist you with any
                questions or challenges you may face. Visit our support page or
                contact us directly for prompt assistance.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </Card>
      </div>
    </div>
  );
};

const Features = () => {
  return (
    <section className="py-20">
      <div className="container mx-auto max-w-6xl px-4">
        <motion.h2
          className="text-3xl md:text-4xl font-bold text-center mb-12"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeIn}
        >
          Features that make writing 10x easier
        </motion.h2>
        <Tabs defaultValue="ideaGeneration" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-8">
            <TabsTrigger value="ideaGeneration">Idea generation</TabsTrigger>
            <TabsTrigger value="outlineCreation">Outline creation</TabsTrigger>
            <TabsTrigger value="writingAssistance">
              Writing assistance
            </TabsTrigger>
            <TabsTrigger value="personalization">Personalization</TabsTrigger>
          </TabsList>
          <motion.div
            className="bg-card rounded-lg p-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeIn}
          >
            <TabsContent value="ideaGeneration" className="mt-0">
              <div className="flex flex-col gap-4">
                <h3 className="text-2xl font-semibold">
                  AI-powered idea generation
                </h3>
                <p className="text-muted-foreground">
                  Overcome writer&apos;s block with our advanced AI that
                  generates unique, engaging article ideas tailored to your
                  niche and audience preferences.
                </p>
                <motion.div
                  className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4"
                  variants={staggerChildren}
                >
                  {[
                    "Trend Analysis & Integration",
                    "Niche-Specific Suggestions",
                    "Audience Interest Alignment",
                    "Keyword Optimization",
                    "Customizable Idea Filters",
                    "Inspiration from Top Performers",
                  ].map((feature, i) => (
                    <motion.div
                      key={i}
                      className="flex items-center gap-2"
                      variants={fadeIn}
                    >
                      <CheckCircle2 className="w-5 h-5 text-primary" />
                      <span>{feature}</span>
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            </TabsContent>
            {/* Add similar enhanced content for other tabs */}
          </motion.div>
        </Tabs>
      </div>
    </section>
  );
};

const PricingSection = () => {
  const pricingTiers = [
    {
      name: "Starter",
      price: "$9",
      description: "Perfect for occasional writers and bloggers",
      features: [
        "5 AI-generated article ideas per month",
        "3 AI-generated outlines per month",
        "Basic writing assistant features",
        "Email support",
      ],
    },
    {
      name: "Pro",
      price: "$29",
      description: "Ideal for regular content creators and freelancers",
      features: [
        "Unlimited AI-generated article ideas",
        "15 AI-generated outlines per month",
        "Advanced writing assistant features",
        "Priority email support",
        "Access to writing templates",
      ],
    },
    {
      name: "Enterprise",
      price: "Custom",
      description: "For teams and high-volume content production",
      features: [
        "Unlimited AI-generated article ideas and outlines",
        "Full suite of writing assistant features",
        "Dedicated account manager",
        "API access for custom integrations",
        "Team collaboration tools",
      ],
    },
  ];

  return (
    <section className="py-20 bg-muted/50">
      <div className="container mx-auto max-w-6xl px-4">
        <motion.h2
          className="text-3xl md:text-4xl font-bold text-center mb-12"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeIn}
        >
          Choose the Perfect Plan for Your Writing Needs
        </motion.h2>
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerChildren}
        >
          {pricingTiers.map((tier, index) => (
            <MotionCard
              key={index}
              className="border-2 border-primary/10 shadow-lg"
              variants={fadeIn}
            >
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-center">
                  {tier.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <div className="text-4xl font-bold mb-4">{tier.price}</div>
                <p className="text-muted-foreground mb-6">{tier.description}</p>
                <ul className="text-left mb-6">
                  {tier.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center mb-2">
                      <Check className="w-5 h-5 text-primary mr-2" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <MotionButton
                  className="w-full"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Get Started
                </MotionButton>
              </CardContent>
            </MotionCard>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative px-4 py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5" />
        <div className="container mx-auto max-w-6xl relative">
          <motion.div
            className="text-center mb-12"
            initial="hidden"
            animate="visible"
            variants={staggerChildren}
          >
            <motion.h1
              className="text-4xl md:text-6xl font-bold text-foreground mb-6 leading-tight"
              variants={fadeIn}
            >
              Overcome writer&apos;s block
              <motion.span
                className="text-primary block mt-2"
                variants={heroSecondLine}
              >
                with AI-powered ideas and outlines
              </motion.span>
            </motion.h1>
            <motion.p
              className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8"
              variants={fadeIn}
            >
              Say goodbye to the blank page. Our AI generates tailored ideas and
              detailed outlines, making it 10x easier to start and complete your
              articles.
            </motion.p>
            <motion.div
              className="flex gap-4 justify-center"
              variants={staggerChildren}
            >
              <MotionButton
                size="lg"
                className="gap-2"
                asChild
                variants={fadeIn}
                whileHover={{ scale: 1.05, transition: { duration: 0.3 } }}
                whileTap={{ scale: 0.95 }}
              >
                <Link href="/login">
                  Start Writing Easily <ArrowRight className="w-4 h-4" />
                </Link>
              </MotionButton>
              <MotionButton
                size="lg"
                variant="outline"
                variants={fadeIn}
                whileHover={{ scale: 1.05, transition: { duration: 0.3 } }}
                whileTap={{ scale: 0.95 }}
              >
                See How It Works
              </MotionButton>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Pain Points Section */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto max-w-6xl px-4">
          <motion.h2
            className="text-3xl md:text-4xl font-bold text-center mb-12"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeIn}
          >
            Struggling with these writing challenges?
          </motion.h2>
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerChildren}
          >
            {[
              {
                icon: <Edit className="w-6 h-6" />,
                title: "Blank page paralysis",
                desc: "Staring at an empty document, unsure where to begin?",
              },
              {
                icon: <Target className="w-6 h-6" />,
                title: "Lack of focus",
                desc: "Ideas scattered, unable to form a coherent structure?",
              },
              {
                icon: <Repeat className="w-6 h-6" />,
                title: "Endless procrastination",
                desc: "Putting off writing due to overwhelm and anxiety?",
              },
            ].map((item, i) => (
              <MotionCard
                key={i}
                className="border-none shadow-md bg-card"
                variants={fadeIn}
                whileHover={{ scale: 1.03, transition: { duration: 0.3 } }}
              >
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <motion.div
                    className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-primary"
                    animate={gentlePulse}
                  >
                    {item.icon}
                  </motion.div>
                  <h3 className="font-semibold mb-2">{item.title}</h3>
                  <p className="text-muted-foreground">{item.desc}</p>
                </CardContent>
              </MotionCard>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-20">
        <div className="container mx-auto max-w-6xl px-4">
          <motion.h2
            className="text-3xl md:text-4xl font-bold text-center mb-12 relative"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeIn}
          >
            <span>Your AI writing assistant: Get ideas and outlines in</span>{" "}
            <span className="relative inline-flex items-center justify-center">
              <span className="z-20">seconds</span>
              <motion.span
                className="bottom-0 inset-x-0 absolute bg-primary/30 h-2 md:h-4 md:-bottom-0.5"
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5, duration: 1, ease: "easeInOut" }}
              ></motion.span>
            </span>
          </motion.h2>
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerChildren}
          >
            {[
              {
                icon: <Lightbulb className="w-6 h-6" />,
                title: "Instant Inspiration",
                desc: "Generate fresh, relevant ideas tailored to your niche and audience.",
              },
              {
                icon: <ListTree className="w-6 h-6" />,
                title: "Structured Outlines",
                desc: "Transform ideas into detailed, logical article structures instantly.",
              },
              {
                icon: <PenTool className="w-6 h-6" />,
                title: "Writing Momentum",
                desc: "Use AI-generated content as a springboard for your creativity.",
              },
            ].map((step, i) => (
              <motion.div
                key={i}
                className="flex flex-col items-center text-center"
                variants={fadeIn}
              >
                <motion.div
                  className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6 text-primary"
                  whileHover={{ scale: 1.1, transition: { duration: 0.3 } }}
                  animate={gentlePulse}
                >
                  {step.icon}
                </motion.div>
                <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                <p className="text-muted-foreground">{step.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto max-w-6xl px-4">
          <motion.h2
            className="text-3xl md:text-4xl font-bold text-center mb-12"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeIn}
          >
            From blank page to brilliant article in 3 easy steps
          </motion.h2>
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerChildren}
          >
            {[
              {
                icon: <Zap className="w-6 h-6" />,
                title: "1. Input Your Topic",
                desc: "Enter your subject or niche, and let our AI understand your focus.",
              },
              {
                icon: <Brain className="w-6 h-6" />,
                title: "2. Generate Ideas & Outline",
                desc: "Choose from AI-suggested ideas and get a comprehensive article structure.",
              },
              {
                icon: <Rocket className="w-6 h-6" />,
                title: "3. Write with Confidence",
                desc: "Use the outline as your roadmap to write engaging content effortlessly.",
              },
            ].map((step, i) => (
              <motion.div
                key={i}
                className="flex flex-col items-center text-center"
                variants={fadeIn}
              >
                <motion.div
                  className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6 text-primary"
                  whileHover={{ scale: 1.1, transition: { duration: 0.3 } }}
                  animate={gentlePulse}
                >
                  {step.icon}
                </motion.div>
                <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                <p className="text-muted-foreground">{step.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      {/* <Features /> */}

      {/* Testimonials */}
      {/* <section className="py-20 bg-background">
        <div className="container mx-auto max-w-6xl px-4">
          <motion.h2
            className="text-3xl md:text-4xl font-bold text-center mb-12"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeIn}
          >
            Writers who overcame their block
          </motion.h2>
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerChildren}
          >
            {[
              {
                name: "Sarah J.",
                role: "Content Creator",
                quote:
                  "This tool turned my writer's block into a flood of ideas. I'm writing more consistently than ever!",
              },
              {
                name: "Michael T.",
                role: "Freelance Writer",
                quote:
                  "The AI-generated outlines save me hours of planning. My productivity has skyrocketed!",
              },
              {
                name: "Emily R.",
                role: "Blogger",
                quote:
                  "I used to struggle starting articles. Now, I can't wait to begin writing with the ideas this tool provides.",
              },
            ].map((testimonial, i) => (
              <MotionCard
                key={i}
                className="border-none shadow-md bg-card"
                variants={fadeIn}
                whileHover={{ scale: 1.03, transition: { duration: 0.3 } }}
              >
                <CardContent className="p-6">
                  <motion.p
                    className="italic mb-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.8 }}
                  >
                    "{testimonial.quote}"
                  </motion.p>
                  <motion.p
                    className="font-semibold"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.8 }}
                  >
                    {testimonial.name}
                  </motion.p>
                  <motion.p
                    className="text-sm text-muted-foreground"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6, duration: 0.8 }}
                  >
                    {testimonial.role}
                  </motion.p>
                </CardContent>
              </MotionCard>
            ))}
          </motion.div>
        </div>
      </section> */}

      <PricingSection />
      <FAQ />
      {/* CTA */}
      <section className="py-20 bg-muted/50 text-foreground">
        <CTASection />
      </section>

      {/* Footer */}
      <footer className="bg-background py-12">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <div className="flex flex-col gap-2 text-muted-foreground">
                <a href="#features">Features</a>
                <a href="#pricing">Pricing</a>
                <a href="#demo">Demo</a>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Resources</h3>
              <div className="flex flex-col gap-2 text-muted-foreground">
                <a href="#blog">Blog</a>
                <a href="#guides">Writing Guides</a>
                <a href="#tutorials">Video Tutorials</a>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <div className="flex flex-col gap-2 text-muted-foreground">
                <a href="#about">About Us</a>
                <a href="#careers">Careers</a>
                <a href="#contact">Contact</a>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <div className="flex flex-col gap-2 text-muted-foreground">
                <a href="#privacy">Privacy Policy</a>
                <a href="#terms">Terms of Service</a>
                <a href="#cookies">Cookie Policy</a>
              </div>
            </div>
          </div>
          <Separator className="my-8" />
          <div className="text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} Articles Generator. All rights
            reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
