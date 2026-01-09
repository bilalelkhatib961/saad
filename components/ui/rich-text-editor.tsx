"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect } from "react";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
}

export function RichTextEditor({
  value,
  onChange,
  className,
  placeholder = "Start typing...",
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder,
      }),
    ],
    immediatelyRender: false,
    content: value,
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-invert max-w-none focus:outline-none min-h-[100px] px-3 py-2",
          "prose-headings:text-white prose-p:text-white prose-strong:text-white prose-em:text-white",
          "prose-ul:text-white prose-ol:text-white prose-li:text-white",
          "prose-a:text-blue-400 prose-code:text-white prose-pre:text-white",
          className
        ),
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [value, editor]);

  if (!editor) {
    return null;
  }

  return (
    <div
      className={cn(
        "w-full rounded-lg border border-gray-600 bg-[#1f1f1f] text-sm text-white",
        "focus-within:border-gray-500 focus-within:ring-2 focus-within:ring-gray-500/20"
      )}
    >
      <div className="flex items-center gap-1 border-b border-gray-700 px-3 py-2">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={cn(
            "rounded px-2 py-1 text-xs font-semibold transition-colors",
            editor.isActive("bold")
              ? "bg-gray-600 text-white"
              : "text-gray-400 hover:bg-gray-700 hover:text-white"
          )}
          title="Bold"
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={cn(
            "rounded px-2 py-1 text-xs font-semibold transition-colors",
            editor.isActive("italic")
              ? "bg-gray-600 text-white"
              : "text-gray-400 hover:bg-gray-700 hover:text-white"
          )}
          title="Italic"
        >
          <em>I</em>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={cn(
            "rounded px-2 py-1 text-xs font-semibold transition-colors",
            editor.isActive("bulletList")
              ? "bg-gray-600 text-white"
              : "text-gray-400 hover:bg-gray-700 hover:text-white"
          )}
          title="Bullet List"
        >
          •
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={cn(
            "rounded px-2 py-1 text-xs font-semibold transition-colors",
            editor.isActive("orderedList")
              ? "bg-gray-600 text-white"
              : "text-gray-400 hover:bg-gray-700 hover:text-white"
          )}
          title="Numbered List"
        >
          1.
        </button>
        <div className="flex-1" />
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className={cn(
            "rounded px-2 py-1 text-xs font-semibold transition-colors",
            editor.can().undo()
              ? "text-gray-400 hover:bg-gray-700 hover:text-white"
              : "cursor-not-allowed text-gray-600"
          )}
          title="Undo"
        >
          ↶
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className={cn(
            "rounded px-2 py-1 text-xs font-semibold transition-colors",
            editor.can().redo()
              ? "text-gray-400 hover:bg-gray-700 hover:text-white"
              : "cursor-not-allowed text-gray-600"
          )}
          title="Redo"
        >
          ↷
        </button>
      </div>
      <EditorContent
        editor={editor}
        className={cn("min-h-[100px] px-3 py-2", className)}
      />
    </div>
  );
}
