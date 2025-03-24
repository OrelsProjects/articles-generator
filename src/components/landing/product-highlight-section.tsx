import Image from "next/image";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface FeatureSectionProps {
  src: string;
  title: string;
  description: string;
  direction?: "ltr" | "rtl";
}

const itemVariants = {
  hidden: { opacity: 0, y: 300 },
  visible: { opacity: 1, y: 0 },
};

const itemVariantsMobile = {
  hidden: { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 10 },
};

function FeatureSectionCard({
  src,
  title,
  description,
  direction = "ltr",
}: FeatureSectionProps) {
  return (
    <div
      className={cn(
        "relative grid items-center gap-6 lg:grid-cols-2 lg:gap-12 px-6 rounded-t-lg border border-primary/15 overflow-clip py-12 rounded-xl",
        {
          "rounded-bl-lg": direction === "ltr",
          "rounded-br-lg": direction === "rtl",
        },
      )}
    >
      {/* <img
        src={
          direction === "rtl"
            ? "/landing/feature-background-flip.png"
            : "/landing/feature-background.png"
        }
        alt="feature background"
        className={cn(
          "absolute inset-0 w-full h-full object-cover z-50 opacity-20",
        )}
      /> */}
      {/* {direction === "rtl" ? (
        <div className="absolute inset-0 rounded-2xl bg-[radial-gradient(ellipse_at_bottom_right,_hsla(24.6,95%,53.1%,0.15),_transparent,_transparent)] z-20"></div>
      ) : (
        <div className="absolute inset-0 rounded-2xl bg-[radial-gradient(ellipse_at_bottom_left,_hsla(24.6,95%,53.1%,0.15),_transparent,_transparent)] z-20"></div>
      )} */}

      <div
        className={cn(
          "space-y-4 mb-16",
          direction === "rtl" && "lg:order-last",
        )}
      >
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {title}
        </h2>
        <p className="text-foreground font-thin">{description}</p>
      </div>
      <div
        className={cn(
          "relative w-fit",
          direction === "rtl" && "lg:order-first",
        )}
      >
        <motion.div
          variants={itemVariants}
          transition={{ duration: 0.5, delay: 0.3 }}
          initial="hidden"
          whileInView="visible"
          className="hidden sm:block max-w-[490px] max-h-[646px] rounded-2xl bg-primary/5 border border-primary/30 p-10"
        >
          <Image
            src={src || "/placeholder.svg"}
            alt={title}
            width={500}
            height={370}
            className="rounded-2xl"
          />
        </motion.div>
        <motion.div
          variants={itemVariantsMobile}
          transition={{ duration: 0.5, delay: 0.3 }}
          initial="hidden"
          whileInView="visible"
          className="block sm:hidden rounded-2xl"
        >
          <Image
            src={src || "/placeholder.svg"}
            alt={title}
            width={500}
            height={370}
            className="rounded-2xl"
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
      className="w-full min-h-screen flex flex-col justify-start items-center gap-12 bg-background py-12 relative px-6 md:px-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div className="landing-section-container flex flex-col gap-12">
        <FeatureSectionCard
          src="/landing/graphs/graph-average-time-to-complete.png"
          title="Webhook completion time insights"
          description="Gain insights into the average time it takes for your webhooks to complete. Identify slow-performing webhooks and optimize processing to improve overall efficiency."
          direction="ltr"
        />
        <FeatureSectionCard
          src="/landing/graphs/graph-webhooks-sent-over-time.png"
          title="Webhook activity trends"
          description="Visualize the volume of webhooks sent over time to detect peak activity periods and usage patterns. Use this data to better plan resource allocation and ensure system stability during high-traffic times."
          direction="rtl"
        />
        <FeatureSectionCard
          src="/landing/features/advanced-filtering.png"
          title="Advanced filtering"
          description="Filter webhooks by status, response time, and more to quickly identify issues and improve reliability. Stay informed and proactive in resolving problems to ensure seamless user experiences."
          direction="ltr"
        />
      </motion.div>
    </motion.section>
  );
}
