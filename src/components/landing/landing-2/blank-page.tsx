import { useEffect, useMemo, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { ChevronDown } from "lucide-react";
import { textEditorOptions } from "@/lib/utils/text-editor";
import { motion } from "framer-motion";

export const BlankPage = () => {
  const editor = useEditor(textEditorOptions());
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const windowHeight = window.innerHeight;
      const fadeStart = windowHeight * 0.1;
      const fadeEnd = windowHeight * 0.5;

      if (scrollPosition > fadeStart) {
        const newOpacity =
          1 - (scrollPosition - fadeStart) / (fadeEnd - fadeStart);
        setOpacity(Math.max(0, Math.min(1, newOpacity)));
      } else {
        setOpacity(1);
      }
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);
  useEffect(() => {
    editor?.chain().focus().run();
  }, [editor]);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center relative bg-white"
      style={{ opacity }}
    >
      <div className="h-[80vh] w-full max-w-4xl mx-auto px-12 py-16 bg-white rounded-lg shadow-sm border border-gray-100">
        {/* Title bar */}
        <div className="flex items-center space-x-2 mb-4">
          <div className="w-4 h-4 rounded-full bg-red-400"></div>
          <div className="w-4 h-4 rounded-full bg-yellow-400"></div>
          <div className="w-4 h-4 rounded-full bg-green-400"></div>
        </div>

        {/* Editor */}
        <div className="min-h-full w-full text-lg font-mono leading-loose relative">
          <EditorContent
            editor={editor}
            className="outline-none border-none focus:ring-0 caret-gray-500 min-h-screen"
          />
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 1.5 }}
        className="absolute bottom-2 left-0 right-0 flex flex-col items-center space-y-2 animate-bounce"
      >
        <span className="text-lg text-foreground">Stuck? Keep scrolling.</span>
        <ChevronDown className="w-6 h-6 text-foreground" />
      </motion.div>
    </div>
  );
};
