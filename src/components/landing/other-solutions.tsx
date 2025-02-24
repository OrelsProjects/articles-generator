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
    title: "ChatGPT hijacks your voice",
    description:
      "Your unique style and personality disappears into AI, making you sound like a robot.",
  },
  {
    icon: Bell,
    title: "Too many distractions",
    description:
      "You want a steralized place to write, but once you see those Substack notifications, you can't resist them.",
  },
  {
    icon: Dices,
    title: "Random, boring topics",
    description:
      "Generic, repeated ideas that don’t resonate with your audience or match your brand.",
  },
  {
    icon: Clock,
    title: "Hours lost finding inspiration",
    description:
      "Endless hours of reading and sifting through articles to spark a single article idea.",
  },
];

const SolutionCard = ({
  icon: Icon,
  title,
  description,
}: SolutionCardProps) => (
  <div className="p-6 bg-muted/50 rounded-lg shadow-sm border">
    <div className="text-2xl mb-2 flex items-center gap-2">
      <Icon className="w-6 h-6 text-destructive" />
      <h3 className="font-medium">{title}</h3>
    </div>
    <p className="mt-4 text-muted-foreground">{description}</p>
  </div>
);

export default function OtherSolutions() {
  return (
    <div className="max-w-5xl pb-36 mx-auto px-6 md:px-0">
      <div className="mb-12">
        <h2 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Writing articles shouldn&apos;t be this{" "}
          <span className="text-destructive">hard</span>
        </h2>
      </div>
      <p className="mt-4 text-base text-muted-foreground">
        Other solutions and tools...
      </p>

      <div className="grid gap-8 mt-12 md:grid-cols-2">
        {solutionCards.map((card, index) => (
          <SolutionCard key={index} {...card} />
        ))}
      </div>
    </div>
  );
}
