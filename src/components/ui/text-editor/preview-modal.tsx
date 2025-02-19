import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { EditorContent } from "@tiptap/react";

export interface PreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  previewEditor: any;
  previewEditorRef: React.Ref<HTMLDivElement>;
  onCancel: () => void;
  onAccept: () => void;
}

const PreviewModal: React.FC<PreviewModalProps> = ({
  open,
  onOpenChange,
  previewEditor,
  previewEditorRef,
  onCancel,
  onAccept,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        closeOnOutsideClick={false}
        className="sm:max-w-[90vw] md:max-w-[60vw] max-h-[80vh] z-[9999]"
      >
        <DialogHeader>
          <DialogTitle>Preview</DialogTitle>
          <DialogDescription>
            You can make additional edits before accepting
          </DialogDescription>
        </DialogHeader>

        <div
          ref={previewEditorRef}
          className="border rounded-md p-4 pt-0 max-h-[50vh] overflow-auto relative"
        >
          <EditorContent editor={previewEditor} />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={onAccept}>Accept</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PreviewModal; 