import { useAppSelector } from "@/lib/hooks/redux";
import { ToastStepper } from "./toast-stepper";

// Define loading states for generating ideas
const ideaLoadingStates = [
  { text: "Finding relevant articles..." },
  { text: "Gathering inspiration from top articles..." },
  { text: "Crafting unique article ideas..." },
  { text: "Building outlines for the ideas..." },
  { text: "Finalizing the best ideas..." },
];

export default function LoadingIdeas() {
  const { loadingNewIdeas } = useAppSelector(state => state.publications);
  return (
    <ToastStepper
      loadingStates={ideaLoadingStates}
      loading={loadingNewIdeas}
      duration={10000}
      loop={false}
      position="bottom-left"
    />
  );
}
