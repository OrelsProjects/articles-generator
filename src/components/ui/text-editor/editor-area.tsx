import React from "react";
import { EditorContent } from "@tiptap/react";

export interface EditorAreaProps {
  editor: any;
}

const EditorArea: React.FC<EditorAreaProps> = ({ editor }) => {
  return (
    <div className="pt-2 tiptap pb-4">
      <EditorContent editor={editor} />
    </div>
  );
};

export default EditorArea; 