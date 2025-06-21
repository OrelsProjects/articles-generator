import * as React from "react";
import { cn } from "@/lib/utils";

interface AutoAdjustTextAreaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "rows"> {
  minRows?: number;
  maxRows?: number;
  onHeightChange?: (height: number) => void;
}

const AutoAdjustTextArea = React.forwardRef<
  HTMLTextAreaElement,
  AutoAdjustTextAreaProps
>(
  (
    { minRows = 1, maxRows, onHeightChange, className, style, ...props },
    ref,
  ) => {
    const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);
    const shadowRef = React.useRef<HTMLDivElement | null>(null);

    const setRef = React.useCallback(
      (node: HTMLTextAreaElement | null) => {
        textareaRef.current = node;
        if (typeof ref === "function") {
          ref(node);
        } else if (ref) {
          (ref as React.MutableRefObject<HTMLTextAreaElement | null>).current =
            node;
        }
      },
      [ref],
    );

    const adjustHeight = React.useCallback(() => {
      const textarea = textareaRef.current;
      const shadow = shadowRef.current;
      if (!textarea || !shadow) return;

      const computed = window.getComputedStyle(textarea);
      shadow.style.width = computed.width;
      shadow.style.font = computed.font;
      shadow.style.fontSize = computed.fontSize;
      shadow.style.fontFamily = computed.fontFamily;
      shadow.style.fontWeight = computed.fontWeight;
      shadow.style.lineHeight = computed.lineHeight;
      shadow.style.letterSpacing = computed.letterSpacing;
      shadow.style.padding = computed.padding;
      shadow.style.border = computed.border;
      shadow.style.boxSizing = computed.boxSizing;
      shadow.style.whiteSpace = "pre-wrap";
      shadow.style.wordWrap = "break-word";

      shadow.textContent = textarea.value + "\n";

      const lineHeight =
        parseFloat(computed.lineHeight) || parseFloat(computed.fontSize) * 1.2;

      const paddingTop = parseFloat(computed.paddingTop) || 0;
      const paddingBottom = parseFloat(computed.paddingBottom) || 0;
      const borderTop = parseFloat(computed.borderTopWidth) || 0;
      const borderBottom = parseFloat(computed.borderBottomWidth) || 0;

      const minHeight =
        minRows * lineHeight +
        paddingTop +
        paddingBottom +
        borderTop +
        borderBottom;
      const maxHeight = maxRows
        ? maxRows * lineHeight +
          paddingTop +
          paddingBottom +
          borderTop +
          borderBottom
        : Infinity;

      const naturalHeight = shadow.scrollHeight;
      const adjustedHeight = Math.min(
        Math.max(naturalHeight, minHeight),
        maxHeight,
      );

      textarea.style.height = `${adjustedHeight}px`;
      textarea.style.overflowY = naturalHeight > maxHeight ? "auto" : "hidden";

      onHeightChange?.(adjustedHeight);
    }, [minRows, maxRows, onHeightChange]);

    React.useEffect(() => {
      adjustHeight();
    }, [props.value, adjustHeight]);

    const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
      adjustHeight();
      props.onInput?.(e);
    };

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      adjustHeight();
      props.onChange?.(e);
    };

    return (
      <>
        <textarea
          {...props}
          ref={setRef}
          className={cn(
            "flex w-full min-h-[60px] rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none",
            className,
          )}
          style={{
            ...style,
          }}
          onInput={handleInput}
          onChange={handleChange}
        />

        <div
          ref={shadowRef}
          style={{
            position: "absolute",
            top: "-9999px",
            left: "-9999px",
            visibility: "hidden",
            height: "auto",
            overflow: "hidden",
          }}
          aria-hidden="true"
        />
      </>
    );
  },
);

AutoAdjustTextArea.displayName = "AutoAdjustTextArea";
export default AutoAdjustTextArea;
