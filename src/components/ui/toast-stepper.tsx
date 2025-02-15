import { AnimatePresence, motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useState, useEffect } from "react";

// Utility function to combine class names
const cn = (...classes: (string | undefined)[]) =>
  classes.filter(Boolean).join(" ");

const CheckIcon = ({ className }: { className?: string }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={cn("w-4 h-4", className)}
    >
      <path d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  );
};

const CheckFilled = ({ className }: { className?: string }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={cn("w-4 h-4", className)}
    >
      <path
        fillRule="evenodd"
        d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z"
        clipRule="evenodd"
      />
    </svg>
  );
};

type LoadingState = {
  text: string;
  delay?: number;
};

const LoaderCore = ({
  loadingStates,
  value = 0,
}: {
  loadingStates: LoadingState[];
  value?: number;
}) => {
  return (
    <div className="flex flex-col gap-2">
      {loadingStates.map((loadingState, index) => {
        const distance = Math.abs(index - value);
        const opacity = Math.max(1 - distance * 0.2, 0);

        return (
          <motion.div
            key={index}
            className={cn("text-left flex items-center gap-2")}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: opacity, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="w-4 h-4">
              {index > value && <CheckIcon className="text-muted-foreground" />}
              {index === value && (
                <Loader2 className="text-primary animate-spin w-4 h-4" />
              )}
              {index < value && <CheckFilled className="text-primary" />}
            </div>
            <span
              className={cn(
                "text-foreground",
                value < index ? "text-foreground" : "",
                value === index ? "text-primary opacity-80" : "",
                value > index ? "text-foreground" : "",
              )}
            >
              {loadingState.text}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
};

export const ToastStepper = ({
  loadingStates,
  loading,
  duration = 2000,
  loop = true,
  position = "bottom-right",
}: {
  loadingStates: LoadingState[];
  loading?: boolean;
  duration?: number;
  loop?: boolean;
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left";
}) => {
  const [currentState, setCurrentState] = useState(0);

  useEffect(() => {
    if (!loading) {
      setCurrentState(0);
      return;
    }

    const durationValue =
      currentState <= loadingStates.length - 1
        ? loadingStates[currentState].delay || duration
        : duration;
    const delay = durationValue * (Math.random() * 0.5 + 1);

    const timeout = setTimeout(() => {
      setCurrentState(prevState =>
        loop
          ? prevState === loadingStates.length - 1
            ? 0
            : prevState + 1
          : Math.min(prevState + 1, loadingStates.length - 1),
      );
    }, delay);

    return () => clearTimeout(timeout);
  }, [currentState, loading, loop, loadingStates.length, duration]);

  const positionClasses = {
    "top-right": "top-4 right-4",
    "top-left": "top-4 left-4",
    "bottom-right": "bottom-4 right-4",
    "bottom-left": "bottom-4 left-4",
  };

  return (
    <AnimatePresence mode="wait">
      {loading && (
        <motion.div
          initial={{ opacity: 0, y: position.startsWith("top") ? -20 : 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: position.startsWith("top") ? -20 : 20 }}
          className={cn(
            "fixed z-50 bg-background rounded-lg shadow-lg p-4 min-w-[300px] max-w-md",
            "border border-border",
            positionClasses[position],
          )}
        >
          <LoaderCore value={currentState} loadingStates={loadingStates} />
        </motion.div>
      )}
    </AnimatePresence>
  );
};
