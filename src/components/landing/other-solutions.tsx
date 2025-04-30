import {
  Bot,
  Building2,
  Clock,
  Copy,
  Shuffle,
  Pen,
  FileStack,
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
    title: "ChatGPT can hurt your voice",
    description:
      "It spits out robotic-sounding text that disconnects you from your readers.",
  },
  {
    icon: FileStack,
    title: "Google Docs slows you down",
    description:
      "Managing your ideas across Docs, Notion, or a custom database turns your workspace into digital chaos.",
  },
  {
    icon: Shuffle,
    title: "Custom GPTs aren’t magic",
    description:
      "Even with one, you’re constantly updating it with your latest work just to keep it useful.",
  },
  {
    icon: Clock,
    title: "Finding ideas eats up time",
    description:
      "It can take hours to decide on a topic—and you don’t know whether people actually want to read until you post it.",
  },
  {
    icon: Pen,
    title: "Daily notes are exhausting",
    description:
      "Notes grow your audience. But writing them consistently? That’s the hard part.",
  },
  {
    icon: Copy,
    title: "Copy & paste is a mess",
    description:
      "Jumping between tools breaks your flow—and ruins your formatting.",
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
    <div className="landing-section-container bg-background rounded-[3rem] shadow-[0_0_10px_rgba(0,0,0,0.2)]">
      <div className="mx-auto px-6 md:px-0">
        <div className="landing-section-top">
          <h2>Stop Wasting Time & Energy on Solvable Problems</h2>
          <p>
            You&apos;re posting notes, writing posts, and chasing trends—on top
            of everything else. And most tools out there?{" "}
            <strong>They&apos;re not made for Substack.</strong>
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
