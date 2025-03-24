import { motion } from "framer-motion";
import { Alert } from "@/components/ui/alert";
import { TooltipButton } from "@/components/ui/tooltip-button";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export const MotionTooltipButton = motion.create(TooltipButton);
export const MotionButton = motion.create(Button);
export const MotionAlert = motion.create(Alert);
export const MotionImage = motion.create(Image);