"use client";

import { useEffect, useState } from "react";
import { useFormik } from "formik";
import { toFormikValidationSchema } from "zod-formik-adapter";
import * as z from "zod";
import {
  Loader2,
  Send,
  Bug,
  Lightbulb,
  MessageSquare,
  HelpCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import axiosInstance from "@/lib/axios-instance";
import { toast } from "react-toastify";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

const feedbackSchema = z.object({
  type: z.enum(["feedback", "question", "bug", "feature"]),
  subject: z
    .string()
    .min(3, "Subject must be at least 3 characters")
    .optional(),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

type FeedbackFormData = z.infer<typeof feedbackSchema>;

interface FeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const feedbackTypes = [
  { value: "feedback", label: "General Feedback", icon: MessageSquare },
  { value: "question", label: "Ask a Question", icon: HelpCircle },
  { value: "bug", label: "Report a Bug", icon: Bug },
  { value: "feature", label: "Feature Request", icon: Lightbulb },
] as const;

export function FeedbackDialog({ open, onOpenChange }: FeedbackDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [wasSubmitted, setWasSubmitted] = useState(true);

  useEffect(() => {
    if (open) {
      setWasSubmitted(false);
    }
  }, [open]);

  const formik = useFormik<FeedbackFormData>({
    initialValues: {
      type: "feedback",
      subject: "",
      message: "",
    },
    validateOnChange: true,
    validateOnBlur: true,
    validationSchema: toFormikValidationSchema(feedbackSchema),
    onSubmit: async (values, { resetForm }) => {
      if (wasSubmitted) return;
      setIsSubmitting(true);
      try {
        const metadata = {
          url: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
        };

        await axiosInstance.post("/api/feedback", {
          ...values,
          metadata,
        });
        setWasSubmitted(true);
        // toast.success(
        //   "Thank you for your feedback! We'll get back to you soon.",
        // );
        // reset after 2.5 seconds
        setTimeout(() => {
          resetForm();
          onOpenChange(false);
          toast.success("Thank you for your feedback.");
          //   setWasSubmitted(false);
        }, 2500);
      } catch (error) {
        console.error("Failed to submit feedback:", error);
        toast.error("Failed to submit feedback. Please try again.");
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Send us your feedback</DialogTitle>
          <DialogDescription>
            We&apos;d love to hear from you! Let us know how we can improve your
            experience.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={formik.handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              What&apos;s this about?
            </label>
            <RadioGroup
              onValueChange={val => formik.setFieldValue("type", val)}
              defaultValue={formik.values.type}
              className="grid grid-cols-2 gap-4"
            >
              {feedbackTypes.map(({ value, label, icon: Icon }) => (
                <div key={value}>
                  <RadioGroupItem
                    value={value}
                    id={value}
                    className="peer sr-only"
                    checked={formik.values.type === value}
                  />
                  <Label
                    htmlFor={value}
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-all"
                  >
                    <Icon className="mb-2 h-6 w-6" />
                    <span className="text-sm font-medium">{label}</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
            {formik.errors.type && formik.touched.type && (
              <p className="text-sm font-medium text-destructive">
                {formik.errors.type}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label
              htmlFor="subject"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Subject
            </label>
            <Input
              id="subject"
              name="subject"
              placeholder="Brief summary of your feedback"
              value={formik.values.subject}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            />
            {formik.errors.subject && formik.touched.subject && (
              <p className="text-sm font-medium text-destructive">
                {formik.errors.subject}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label
              htmlFor="message"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Message
            </label>
            <Textarea
              id="message"
              name="message"
              placeholder="Tell us more..."
              className="min-h-[120px] resize-none"
              value={formik.values.message}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            />
            {formik.errors.message && formik.touched.message && (
              <p className="text-sm font-medium text-destructive">
                {formik.errors.message}
              </p>
            )}
          </div>

          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className={cn(
                "transition-all duration-300",
                wasSubmitted && "!bg-primary !text-primary-foreground",
              )}
              disabled={isSubmitting}
            >
              <AnimatePresence>
                {wasSubmitted ? (
                  // Fade in a Thank you text
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.1 }}
                  >
                    Thank you.
                  </motion.span>
                ) : (
                  // Show the send button

                  <div className="flex items-center gap-2">
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        Send Feedback
                        <Send className="mr-2 h-4 w-4" />
                      </>
                    )}
                  </div>
                )}
              </AnimatePresence>
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
