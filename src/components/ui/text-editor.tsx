import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Heading from "@tiptap/extension-heading";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import CodeBlock from "@tiptap/extension-code-block";
import BulletList from "@tiptap/extension-bullet-list";
import Document from "@tiptap/extension-document";
import ListItem from "@tiptap/extension-list-item";
import Paragraph from "@tiptap/extension-paragraph";
import Text from "@tiptap/extension-text";
import { Extension } from "@tiptap/core";
import {
  ArrowLeft,
  Bold,
  Italic,
  Strikethrough,
  Code,
  LinkIcon,
  ImageIcon,
  Headphones,
  Video,
  MessageSquare,
  List,
  ListOrdered,
  Undo,
  Redo,
  ChevronDown,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";
import axios from "axios";
import { Idea } from "@/models/idea";

const CustomKeymap = Extension.create({
  name: "customKeymap",
  addKeyboardShortcuts() {
    return {
      Enter: () => this.editor.commands.newlineInCode(),
    };
  },
});

const CustomHeading = Heading.extend({
  renderHTML({ node, HTMLAttributes }) {
    switch (node.attrs.level) {
      case 1:
        return [
          "h1",
          {
            ...HTMLAttributes,
            class:
              "text-[2.5em] leading-[1.16em] mt-[1em] mb-[0.625em] font-bold",
          },
          0,
        ];
      case 2:
        return [
          "h2",
          {
            ...HTMLAttributes,
            class:
              "text-[2.125em] leading-[1.16em] mt-[1em] mb-[0.625em] font-bold",
          },
          0,
        ];
      case 3:
        return [
          "h3",
          {
            ...HTMLAttributes,
            class:
              "text-[1.875em] leading-[1.16em] mt-[1em] mb-[0.625em] font-bold",
          },
          0,
        ];
      case 4:
        return [
          "h4",
          {
            ...HTMLAttributes,
            class:
              "text-[1.625em] leading-[1.16em] mt-[1em] mb-[0.625em] font-bold",
          },
          0,
        ];
      case 5:
        return [
          "h5",
          {
            ...HTMLAttributes,
            class:
              "text-[1.125em] leading-[1.16em] mt-[1em] mb-[0.625em] font-bold",
          },
          0,
        ];
      case 6:
        return [
          "h6",
          {
            ...HTMLAttributes,
            class:
              "text-[0.83em] leading-[1.16em] mt-[1em] mb-[0.625em] font-bold",
          },
          0,
        ];
      default:
        return ["h" + node.attrs.level, HTMLAttributes, 0];
    }
  },
});

const AILoadingAnimation = () => (
  <div className="flex items-center gap-2 px-3 py-1.5">
    <div className="flex space-x-1">
      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
    </div>
    <span className="text-sm text-blue-500 font-medium">AI is thinking...</span>
  </div>
);

const IdeasPanel = ({
  ideas,
  onSelectIdea,
  onClose,
}: {
  ideas: Idea[];
  onSelectIdea: (idea: Idea) => void;
  onClose: () => void;
}) => {
  if (ideas.length === 0) return null;
  return (
    <div className="fixed right-4 top-24 w-80 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-blue-500" />
          <h3 className="font-semibold text-gray-900">Generated Ideas</h3>
        </div>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          ×
        </button>
      </div>
      <div className="max-h-[60vh] overflow-y-auto">
        {ideas.map((idea: Idea, index: number) => (
          <button
            key={index}
            onClick={() => onSelectIdea(idea)}
            className="w-full p-4 text-left hover:bg-gray-50 border-b border-gray-100 transition-colors group"
          >
            <h4 className="font-medium text-gray-900 mb-1 group-hover:text-blue-600 flex items-center gap-2">
              {idea.title}
              <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </h4>
            <p className="text-sm text-gray-600">{idea.subtitle}</p>
          </button>
        ))}
      </div>
    </div>
  );
};

const TopNav = () => {
  return (
    <div className="w-full flex items-center justify-between px-4 py-2 sticky top-0 bg-white border-b border-gray-200 z-50">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-2 text-lg">
          <div className="w-2 h-2 bg-green-500 rounded-full" />
          <span className="text-muted-foreground">Draft</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" className="text-lg">
          Preview
        </Button>
        <Button variant="default" className="text-lg">
          Continue
        </Button>
      </div>
    </div>
  );
};

const MenuBar = ({ editor }: { editor: any }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [showIdeas, setShowIdeas] = useState(false);

  const generateIdeas = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    setShowIdeas(true);
    try {
      const res = await axios.get("api/post/generate/ideas", {
        params: {
          url: "https://emdiary.substack.com",
        },
      });
      debugger;
      setIdeas(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectIdea = (idea: Idea) => {
    console.log("Selected idea:", idea);
  };

  if (!editor) return null;

  return (
    <>
      <div className="flex items-center justify-center gap-3 p-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
          >
            <Undo className="w-6 h-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
          >
            <Redo className="w-6 h-6" />
          </Button>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1">
              Style
              <ChevronDown className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem
              onClick={() => editor.chain().focus().setParagraph().run()}
            >
              Normal Text
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 1 }).run()
              }
            >
              Heading 1
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 2 }).run()
              }
            >
              Heading 2
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={cn(editor.isActive("bold") && "bg-muted")}
          >
            <Bold className="w-6 h-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={cn(editor.isActive("italic") && "bg-muted")}
          >
            <Italic className="w-6 h-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={cn(editor.isActive("strike") && "bg-muted")}
          >
            <Strikethrough className="w-6 h-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleCode().run()}
            className={cn(editor.isActive("code") && "bg-muted")}
          >
            <Code className="w-6 h-6" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon">
            <LinkIcon className="w-6 h-6" />
          </Button>
          <Button variant="ghost" size="icon">
            <ImageIcon className="w-6 h-6" />
          </Button>
          <Button variant="ghost" size="icon">
            <Headphones className="w-6 h-6" />
          </Button>
          <Button variant="ghost" size="icon">
            <Video className="w-6 h-6" />
          </Button>
          <Button variant="ghost" size="icon">
            <MessageSquare className="w-6 h-6" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={cn(editor.isActive("bulletList") && "bg-muted")}
          >
            <List className="w-6 h-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={cn(editor.isActive("orderedList") && "bg-muted")}
          >
            <ListOrdered className="w-6 h-6" />
          </Button>
        </div>

        <Button
          variant="ghost"
          size="lg"
          className="px-4 gap-2"
          onClick={generateIdeas}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <AILoadingAnimation />
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Generate Ideas
            </>
          )}
        </Button>
      </div>

      {showIdeas && (
        <IdeasPanel
          ideas={ideas}
          onSelectIdea={handleSelectIdea}
          onClose={() => setShowIdeas(false)}
        />
      )}
    </>
  );
};

const TextEditor = () => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        paragraph: {
          HTMLAttributes: { class: "mb-4" },
        },
      }),
      Document,
      Paragraph,
      Text,
      BulletList,
      ListItem,
      CustomHeading,
      CustomKeymap,
      CustomHeading.configure({
        levels: [1, 2],
      }),
      Image,
      Link,
      Subscript,
      Superscript,
      CodeBlock,
      Placeholder.configure({
        placeholder: "Start writing...",
      }),
    ],
    content: "",
    editorProps: {
      attributes: {
        class: "prose prose-lg mx-auto focus:outline-none h-full py-4",
      },
    },
  });

  return (
    <div className="w-full min-h-screen bg-white">
      <TopNav />
      <div className="w-full flex flex-col justify-start items-center">
        <div className="flex flex-col justify-start items-center gap-2 w-full">
          <MenuBar editor={editor} />
          <div className="py-4 max-w-[728px] space-y-6 w-full px-4">
            <input
              type="text"
              placeholder="Title"
              className="w-full text-4xl font-bold outline-none placeholder:text-gray-400"
            />
            <input
              type="text"
              placeholder="Add a subtitle..."
              className="w-full text-xl text-gray-500 outline-none placeholder:text-gray-400"
            />
            <EditorContent editor={editor} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TextEditor;
