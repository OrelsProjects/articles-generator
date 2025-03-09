import {
  Bell,
  Bot,
  Box,
  Brain,
  Building2,
  Clock,
  Dice1,
  Dice2,
  Dices,
  DollarSign,
  Copy,
  Shuffle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface SolutionCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

const solutionCards: SolutionCardProps[] = [
  {
    icon: Bot,
    title: "ChatGPT doesn't understand Substack",
    description:
      "Generic AI tools don't integrate with Substack, forcing you to constantly copy/paste and switch between platforms.",
  },
  {
    icon: Copy,
    title: "Copy/paste workflow wastes time",
    description:
      "Keeping all your articles and notes in Google Docs is a pain. The format doesn't work well with Substack and it becomes a mess.",
  },
  {
    icon: Shuffle,
    title: "Inconsistent newsletter quality",
    description:
      "Without a specialized tool for newsletter writers, your content quality varies wildly from issue to issue.",
  },
  {
    icon: Clock,
    title: "Hours lost finding inspiration",
    description:
      "Successful Substack writers earning $1k+/month can't afford to waste time searching for their next great newsletter idea.",
  },
];

const SolutionCard = ({
  icon: Icon,
  title,
  description,
}: SolutionCardProps) => (
  <div className="p-6 bg-background rounded-lg shadow-sm border">
    <div className="text-2xl mb-2 flex items-center gap-2">
      <Icon className="w-6 h-6 text-destructive" />
      <h3 className="font-medium">{title}</h3>
    </div>
    <p className="mt-4 text-muted-foreground">{description}</p>
  </div>
);

export default function OtherSolutions() {
  return (
    <div className="landing-section-container bg-muted">
      <div className="mx-auto px-6 md:px-0">
        <div className="landing-section-top">
          <h3>Post more, in less time</h3>
          <h2>Building a community is hard enough already</h2>
          <p>
            Writing notes is often overlooked, yet it has one of the highest
            ROIs to grow your community. WriteRoom helps you write it and manage
            it efficiently, so you can focus on scaling your business.
          </p>
        </div>

        <div className="grid gap-8 mt-12 md:grid-cols-2">
          {solutionCards.map((card, index) => (
            <SolutionCard key={index} {...card} />
          ))}
        </div>
      </div>
    </div>
  );
}
