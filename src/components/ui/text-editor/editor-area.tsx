import React from "react";
import { EditorContent } from "@tiptap/react";
import { cn } from "@/lib/utils";
import { Lora } from "@/lib/utils/fonts";

export interface EditorAreaProps {
  editor: any;
}

const EditorArea: React.FC<EditorAreaProps> = ({ editor }) => {
  return (
    <div className={cn("pt-2 tiptap pb-4", Lora.className)}>
      <EditorContent editor={editor} />
    </div>
  );
};

export default EditorArea;
