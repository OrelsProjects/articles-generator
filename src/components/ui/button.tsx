import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const baseClassName =
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50";

const buttonVariants = cva(baseClassName, {
  variants: {
    variant: {
      default: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
      destructive:
        "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
      outline:
        "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
      "outline-primary":
        "border border-primary/40 bg-background shadow-sm hover:border-primary/80 hover:!bg-background text-primary",
      secondary:
        "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
      ghost: "hover:bg-accent hover:text-accent-foreground",
      "ghost-hover":
        "hover:bg-accent hover:text-accent-foreground hover:text-primary",
      link: "text-primary underline-offset-4 hover:underline",
      "link-foreground":
        "text-foreground/90 underline-offset-4 hover:underline hover:text-foreground hover:underline",
      "neumorphic-primary":
        "rounded-md bg-gradient-to-b from-primary via-primary/80 to-primary/60 text-primary-foreground shadow-md border !border-primary px-4 py-2 transition-colors font-semibold",
      clean: "",
    },
    size: {
      default: "h-9 px-4 py-2",
      sm: "h-8 rounded-md px-3 text-xs",
      lg: "h-10 rounded-md px-8",
      icon: "h-9 w-9",
      clean: "",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
});

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  clean?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant, size, asChild = false, clean = false, ...props },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={
          clean
            ? cn(baseClassName, className)
            : cn(buttonVariants({ variant, size, className }))
        }
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
