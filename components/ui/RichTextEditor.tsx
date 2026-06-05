"use client";

// components/ui/RichTextEditor.tsx
// Requires: npm install @tiptap/react @tiptap/pm @tiptap/starter-kit
//           @tiptap/extension-placeholder @tiptap/extension-link
//           @tiptap/extension-underline @tiptap/extension-text-align
//           @tiptap/extension-image

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Image from "@tiptap/extension-image";
import { useEffect, useCallback, useRef, useState } from "react";
import {
  Bold,
  Italic,
  UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Minus,
  Undo,
  Redo,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Heading1,
  Heading2,
  Heading3,
  Link as LinkIcon,
  Code,
  RemoveFormatting,
  ImagePlus,
  Loader2,
} from "lucide-react";
import { clsx } from "clsx";

function ToolbarBtn({
  onClick,
  active = false,
  disabled = false,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      disabled={disabled}
      title={title}
      className={clsx(
        "p-1.5 rounded-lg transition-colors",
        active
          ? "bg-zinc-900 text-white"
          : "text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100",
        disabled && "opacity-30 cursor-not-allowed",
      )}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="w-px h-5 bg-zinc-200 mx-1 shrink-0" />;
}

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
  readOnly?: boolean;
  onImageUpload?: (file: File) => Promise<string>;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Start writing…",
  minHeight = 400,
  readOnly = false,
  onImageUpload,
}: RichTextEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        // Disabled here — configured separately below to avoid duplicate extension warnings
        link: false,
        underline: false,
      }),
      Placeholder.configure({ placeholder }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: "text-blue-600 underline cursor-pointer" },
      }),
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Image.configure({
        HTMLAttributes: { class: "rounded-xl max-w-full my-4" },
        allowBase64: false,
      }),
    ],
    content: value,
    editable: !readOnly,
    immediatelyRender: false, // prevents SSR/hydration mismatch in Next.js
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: { class: "outline-none prose prose-sm max-w-none" },
    },
  });

  useEffect(() => {
    if (!editor) return;
    if (editor.getHTML() !== value)
      editor.commands.setContent(value || "", {
        parseOptions: { preserveWhitespace: "full" },
      });
  }, [value, editor]);

  const setLink = useCallback(() => {
    if (!editor) return;
    const prev = editor.getAttributes("link").href;
    const url = window.prompt("Enter URL", prev || "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().setLink({ href: url }).run();
  }, [editor]);

  const handleImageFile = useCallback(
    async (file: File) => {
      if (!editor || !onImageUpload) return;
      setUploading(true);
      try {
        const url = await onImageUpload(file);
        editor.chain().focus().setImage({ src: url, alt: file.name }).run();
      } catch {
        alert("Image upload failed. Please try again.");
      } finally {
        setUploading(false);
      }
    },
    [editor, onImageUpload],
  );

  // Paste image from clipboard
  useEffect(() => {
    if (!editor || !onImageUpload) return;
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of Array.from(items)) {
        if (item.type.startsWith("image/")) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) handleImageFile(file);
          break;
        }
      }
    };
    const el = editor.view.dom;
    el.addEventListener("paste", handlePaste);
    return () => el.removeEventListener("paste", handlePaste);
  }, [editor, onImageUpload, handleImageFile]);

  if (!editor) return null;

  return (
    <div className="border border-zinc-200 rounded-2xl overflow-hidden bg-white">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleImageFile(file);
          e.target.value = "";
        }}
      />

      {!readOnly && (
        <div className="flex flex-wrap items-center gap-0.5 px-3 py-2 border-b border-zinc-100 bg-zinc-50/80 sticky top-0 z-10">
          <ToolbarBtn
            title="Undo"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
          >
            <Undo className="w-3.5 h-3.5" />
          </ToolbarBtn>
          <ToolbarBtn
            title="Redo"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
          >
            <Redo className="w-3.5 h-3.5" />
          </ToolbarBtn>
          <Divider />
          <ToolbarBtn
            title="Heading 1"
            active={editor.isActive("heading", { level: 1 })}
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 1 }).run()
            }
          >
            <Heading1 className="w-3.5 h-3.5" />
          </ToolbarBtn>
          <ToolbarBtn
            title="Heading 2"
            active={editor.isActive("heading", { level: 2 })}
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
          >
            <Heading2 className="w-3.5 h-3.5" />
          </ToolbarBtn>
          <ToolbarBtn
            title="Heading 3"
            active={editor.isActive("heading", { level: 3 })}
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 3 }).run()
            }
          >
            <Heading3 className="w-3.5 h-3.5" />
          </ToolbarBtn>
          <Divider />
          <ToolbarBtn
            title="Bold"
            active={editor.isActive("bold")}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            {" "}
            <Bold className="w-3.5 h-3.5" />
          </ToolbarBtn>
          <ToolbarBtn
            title="Italic"
            active={editor.isActive("italic")}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            {" "}
            <Italic className="w-3.5 h-3.5" />
          </ToolbarBtn>
          <ToolbarBtn
            title="Underline"
            active={editor.isActive("underline")}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
          >
            {" "}
            <UnderlineIcon className="w-3.5 h-3.5" />
          </ToolbarBtn>
          <ToolbarBtn
            title="Strikethrough"
            active={editor.isActive("strike")}
            onClick={() => editor.chain().focus().toggleStrike().run()}
          >
            {" "}
            <Strikethrough className="w-3.5 h-3.5" />
          </ToolbarBtn>
          <ToolbarBtn
            title="Inline code"
            active={editor.isActive("code")}
            onClick={() => editor.chain().focus().toggleCode().run()}
          >
            {" "}
            <Code className="w-3.5 h-3.5" />
          </ToolbarBtn>
          <Divider />
          <ToolbarBtn
            title="Align left"
            active={editor.isActive({ textAlign: "left" })}
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
          >
            {" "}
            <AlignLeft className="w-3.5 h-3.5" />
          </ToolbarBtn>
          <ToolbarBtn
            title="Align center"
            active={editor.isActive({ textAlign: "center" })}
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
          >
            {" "}
            <AlignCenter className="w-3.5 h-3.5" />
          </ToolbarBtn>
          <ToolbarBtn
            title="Align right"
            active={editor.isActive({ textAlign: "right" })}
            onClick={() => editor.chain().focus().setTextAlign("right").run()}
          >
            {" "}
            <AlignRight className="w-3.5 h-3.5" />
          </ToolbarBtn>
          <Divider />
          <ToolbarBtn
            title="Bullet list"
            active={editor.isActive("bulletList")}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            {" "}
            <List className="w-3.5 h-3.5" />
          </ToolbarBtn>
          <ToolbarBtn
            title="Numbered list"
            active={editor.isActive("orderedList")}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            <ListOrdered className="w-3.5 h-3.5" />
          </ToolbarBtn>
          <ToolbarBtn
            title="Blockquote"
            active={editor.isActive("blockquote")}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
          >
            {" "}
            <Quote className="w-3.5 h-3.5" />
          </ToolbarBtn>
          <ToolbarBtn
            title="Divider"
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
          >
            <Minus className="w-3.5 h-3.5" />
          </ToolbarBtn>
          <Divider />
          <ToolbarBtn
            title="Insert link"
            active={editor.isActive("link")}
            onClick={setLink}
          >
            <LinkIcon className="w-3.5 h-3.5" />
          </ToolbarBtn>
          {onImageUpload && (
            <ToolbarBtn
              title="Insert image"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <ImagePlus className="w-3.5 h-3.5" />
              )}
            </ToolbarBtn>
          )}
          <ToolbarBtn
            title="Clear formatting"
            onClick={() =>
              editor.chain().focus().clearNodes().unsetAllMarks().run()
            }
          >
            <RemoveFormatting className="w-3.5 h-3.5" />
          </ToolbarBtn>
        </div>
      )}

      <EditorContent
        editor={editor}
        className="px-6 py-5"
        style={{ minHeight }}
      />
    </div>
  );
}

export function RichTextPreview({
  html,
  className,
}: {
  html: string;
  className?: string;
}) {
  return (
    <div
      className={clsx("prose prose-sm max-w-none", className)}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
