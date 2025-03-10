import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Max number of visible lines before clamping */
  maxLines?: number;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, maxLines = 5, ...props }, ref) => {
    const internalRef = React.useRef<HTMLTextAreaElement | null>(null);

    // Merge internalRef with forwarded ref
    const handleRef = (node: HTMLTextAreaElement | null) => {
      internalRef.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref)
        (ref as React.MutableRefObject<HTMLTextAreaElement | null>).current =
          node;
    };

    const resizeTextarea = (textarea: HTMLTextAreaElement) => {
      // Reset so shrinking is possible when text is removed
      textarea.style.height = "auto";

      // Get line-height (assumes your CSS sets one explicitly)
      const lineHeight = parseInt(
        window.getComputedStyle(textarea).lineHeight,
        10,
      );
      const minHeight = lineHeight / 2; // only 1 line tall by default
      const maxHeight = lineHeight * maxLines;

      // Clamp the scrollHeight between minHeight and maxHeight
      const newHeight = Math.min(
        Math.max(textarea.scrollHeight, minHeight),
        maxHeight,
      );
      textarea.style.height = `${newHeight}px`;
    };

    // Resize when content changes
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      resizeTextarea(e.currentTarget);
      props.onChange?.(e);
    };

    // Resize on mount & when value changes (so controlled components work correctly)
    React.useEffect(() => {
      if (internalRef.current) {
        resizeTextarea(internalRef.current);
      }
    }, [props.value, props.defaultValue]);

    return (
      <textarea
        ref={handleRef}
        onChange={handleChange}
        className={cn(
          "w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm",
          "placeholder:text-muted-foreground focus-visible:outline-none",
          "focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      />
    );
  },
);

Textarea.displayName = "Textarea";
