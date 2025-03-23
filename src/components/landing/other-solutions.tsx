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
    title: "ChatGPT is simply not good enough",
    description:
      "ChatGPT generates robotic like text that is not good for your community.",
  },
  {
    icon: FileStack,
    title: "Docs/Notion/Evernote waste time",
    description:
      "Keeping all your articles and notes in Google Docs, or making a database in Notion is a mess.",
  },
  {
    icon: Shuffle,
    title: "Inconsistent notes quality",
    description:
      "Even with a custom GPT, you still have to keep updating it with new information all the time.",
  },
  {
    icon: Clock,
    title: "Hours lost finding inspiration",
    description:
      "Finding an idea for a new article takes time. And you have to find something that people will actually want to read.",
  },
  {
    icon: Pen,
    title: "Writing notes every day is hard",
    description:
      "Writing notes is the best way to build a community and grow your business. Damn hard to do it a few times a day.",
  },
  {
    icon: Copy,
    title: "Copy/pastes are a pain",
    description:
      "Copying and pasting notes from Google Docs, Notion or Evernote is a time-consuming and the formatting is not always good.",
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
          <h2>
            Building a community is{" "}
            <span className="text-destructive">hard</span> enough already
          </h2>
          <p>
            Posting notes daily, writing an article a week and keeping up with
            the hottest trends takes a lot of time. And the solutions out there
            are not built for Substack.
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
