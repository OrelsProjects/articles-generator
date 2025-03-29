import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { MotionImage } from "@/components/ui/motion-components";

interface FeatureSectionProps {
  src: string;
  title: string;
  description: string;
  direction?: "ltr" | "rtl";
  longImage?: boolean;
  rotateImage?: boolean;
  sideViewImage?: boolean;
}

const itemVariants = {
  hidden: { opacity: 0, y: 300 },
  visible: { opacity: 1, y: 0 },
};

const itemVariantsLongImage = (rotate?: boolean) => ({
  hidden: { opacity: 0, y: 300, x: 300, rotate: rotate ? -12 : 0 },
  visible: { opacity: 1, y: "-33%", x: 0 },
});

const itemVariantsMobile = {
  hidden: { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 10 },
};

const itemVariantsMobileLongImage = (rotate?: boolean) => ({
  hidden: { opacity: 0, y: 50, x: 50, rotate: rotate ? -12 : 0 },
  visible: { opacity: 1, y: "-12%", x: 0 },
});
// Slide from right to left
const itemVariantsSideViewImage = {
  hidden: { opacity: 0, x: 30, scale: 1.6, rotate: -12 },
  visible: { opacity: 1, x: 20, scale: 1.6 },
};
const itemVariantsSideViewImageMobile = {
  hidden: { opacity: 0, x: 150,  scale: 1.6, rotate: -12 },
  visible: { opacity: 1, x: 20, scale: 1.6 },
};

function FeatureSectionCard({
  src,
  title,
  description,
  direction = "ltr",
  longImage = false,
  rotateImage = false,
  sideViewImage = false,
}: FeatureSectionProps) {
  return (
    <div
      className={cn(
        "h-full grid items-center gap-6 lg:grid-cols-2 lg:gap-12 px-6 rounded-t-lg border border-primary/15 overflow-clip py-12 rounded-xl max-h-[653px] lg:max-h-[444px] relative",
        {
          "rounded-bl-lg": direction === "ltr",
          "rounded-br-lg": direction === "rtl",
        },
      )}
    >
      <div
        className={cn(
          "space-y-4 mb-16",
          direction === "rtl" && "lg:order-last",
        )}
      >
        <h4
          className="text-2xl font-bold tracking-tight sm:text-3xl !text-start"
          dangerouslySetInnerHTML={{ __html: title }}
        />

        <p
          className="text-foreground font-thin !text-start"
          dangerouslySetInnerHTML={{ __html: description }}
        />
      </div>
      <div
        className={cn(
          "relative w-fit",
          direction === "rtl" && "lg:order-first",
        )}
      >
        <motion.div
          className={cn(
            "hidden sm:block max-w-[490px] max-h-[446px] rounded-2xl bg-primary/5 border border-primary/30 p-10 overflow-hidden",
            sideViewImage && "overflow-hidden",
          )}
        >
          <MotionImage
            variants={
              sideViewImage
                ? itemVariantsSideViewImage
                : longImage
                  ? itemVariantsLongImage(rotateImage)
                  : itemVariants
            }
            transition={{ duration: 0.5 }}
            initial="hidden"
            whileInView="visible"
            src={src || "/placeholder.svg"}
            alt={title}
            width={500}
            height={370}
            className={cn(
              "rounded-2xl",
              rotateImage && "rotate-12",
              sideViewImage && "object-cover",
            )}
          />
        </motion.div>
        <motion.div className="block sm:hidden rounded-2xl">
          <MotionImage
            variants={
              sideViewImage
                ? itemVariantsSideViewImageMobile
                : longImage
                  ? itemVariantsMobileLongImage(rotateImage)
                  : itemVariantsMobile
            }
            transition={{ duration: 0.5 }}
            initial="hidden"
            whileInView="visible"
            src={src || "/placeholder.svg"}
            alt={title}
            width={500}
            height={370}
            className={cn("rounded-2xl", rotateImage && "rotate-12")}
          />
        </motion.div>
      </div>
    </div>
  );
}
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.3,
    },
  },
};

export default function FeatureSection() {
  return (
    <motion.section
      className="w-full min-h-screen flex flex-col justify-start items-center gap-12 bg-background py-4 lg:py-12 relative md:px-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div className="landing-section-container landing-section-top flex flex-col px-6 md:px-0">
        <h2>
          Our best features to help you{" "}
          <span className="text-primary">grow 2.7x faster</span>
        </h2>
        <p className="mb-12">
          We&apos;ve built a suite of features to help you grow your audience
          and get more subscribers.
        </p>
        <div className="flex flex-col gap-12">
          <FeatureSectionCard
            src="/landing/features/notes-editor.png"
            title="Use WriteRoom's AI to outline and write <span class='highlight-feature-text'>100% of your note</span>"
            description="Generate notes that are tailored exactly to your audience with WriteRoom's AI that's trained on millions of notes and post them instantly from WriteRoom."
            longImage
            rotateImage
            direction="ltr"
          />
          <FeatureSectionCard
            src="/landing/features/inspirations.png"
            title="<span class='highlight-feature-text'>Get inspired</span> by top viral posts in your specific niche"
            description="WriteRoom curates the top viral posts in your specific niche and shows you the best of them so you never run out of ideas."
            direction="rtl"
          />
          <FeatureSectionCard
            src="/landing/features/kanban-board.png"
            title="Organize your notes in a <span class='highlight-feature-text'>Kanban board</span>"
            description="The Kanban view lets you visually organize and track your notes in columns. Easily manage posts by status—drafts, ready or published—all at a glance."
            direction="ltr"
            sideViewImage
          />
          <FeatureSectionCard
            src="/landing/features/advanced-filtering.png"
            title="Run your research on <span class='highlight-feature-text'>millions of notes</span>"
            description="Use advanced filtering to research through millions of updating notes and stay update-to-date with the latest trends."
            direction="rtl"
          />
        </div>
      </motion.div>
    </motion.section>
  );
}
