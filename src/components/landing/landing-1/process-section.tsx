import React from "react";
import { motion } from "framer-motion";
import { Lightbulb, Database, PenTool, Send } from "lucide-react";
import { Card } from "@/components/ui/card";

interface ProcessStepProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const ProcessStep = ({
  icon,
  title = "Step Title",
  description = "Step description goes here",
}: ProcessStepProps) => {
  return (
    <Card className="p-6 bg-gray-900 border-gray-800 hover:border-electric-blue transition-all duration-300">
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="p-3 rounded-full bg-gray-800 text-electric-blue">
          {icon}
        </div>
        <h3 className="text-xl font-bold text-white">{title}</h3>
        <p className="text-gray-400">{description}</p>
      </div>
    </Card>
  );
};

interface ProcessSectionProps {
  steps?: Array<{
    icon: React.ReactNode;
    title: string;
    description: string;
  }>;
}

const ProcessSection = ({ steps }: ProcessSectionProps) => {
  const defaultSteps = [
    {
      icon: <Lightbulb size={24} />,
      title: "Generate Ideas",
      description:
        "Get personalized article suggestions based on your past content and niche leaders",
    },
    {
      icon: <Database size={24} />,
      title: "Access Insights",
      description:
        "Discover what makes top articles in your niche successful while staying true to your voice",
    },
    {
      icon: <PenTool size={24} />,
      title: "Craft Content",
      description:
        "Get AI-generated outlines that maintain your unique perspective and writing style",
    },
    {
      icon: <Send size={24} />,
      title: "Publish & Share",
      description: "Seamlessly publish your content to your preferred platform",
    },
  ];

  const stepsToShow = steps || defaultSteps;

  return (
    <section className="w-full py-20 bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-3xl md:text-4xl font-bold text-white mb-4"
          >
            How It Works
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-gray-400 text-lg"
          >
            Four simple steps to transform your content creation process
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {stepsToShow.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <ProcessStep
                icon={step.icon}
                title={step.title}
                description={step.description}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProcessSection;
