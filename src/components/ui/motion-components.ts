import { motion } from "framer-motion";
import { Alert } from "@/components/ui/alert";
import { TooltipButton } from "@/components/ui/tooltip-button";
import { Button } from "@/components/ui/button";
export const MotionTooltipButton = motion.create(TooltipButton);
export const MotionButton = motion.create(Button);
export const MotionAlert = motion.create(Alert);
