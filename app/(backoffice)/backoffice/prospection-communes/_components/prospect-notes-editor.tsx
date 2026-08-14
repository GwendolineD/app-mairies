"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import { Bold, Italic, List, ListOrdered } from "lucide-react";
import { useEffect } from "react";
import {
  prospectNotesEditorExtensions,
  prospectNotesProseClassName,
  type ProspectNoteFontSize,
} from "@/lib/prospect-outreach/notes-editor-config";
import { cn } from "@/lib/utils/cn";

type Props = {
  value: Record<string, unknown> | null;
  onChange: (value: Record<string, unknown>) => void;
  disabled?: boolean;
};

function ToolbarButton({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        "inline-flex size-8 cursor-pointer items-center justify-center rounded-sm border border-border bg-surface text-text transition hover:bg-warm",
        active && "border-purple bg-soft-pink text-purple",
      )}
    >
      {children}
    </button>
  );
}

export function ProspectNotesEditor({ value, onChange, disabled }: Props) {
  const editor = useEditor({
    extensions: prospectNotesEditorExtensions,
    content: value ?? { type: "doc", content: [] },
    editable: !disabled,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "min-h-40 p-3 text-sm font-medium leading-5 text-text outline-none",
      },
    },
    onUpdate: ({ editor: current }) => {
      onChange(
        JSON.parse(JSON.stringify(current.getJSON())) as Record<string, unknown>,
      );
    },
  });

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!disabled);
  }, [disabled, editor]);

  if (!editor) return null;

  function setFontSize(size: ProspectNoteFontSize) {
    editor?.chain().focus().setProspectFontSize(size).run();
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <ToolbarButton
          label="Gras"
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="size-4" aria-hidden />
        </ToolbarButton>
        <ToolbarButton
          label="Italique"
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="size-4" aria-hidden />
        </ToolbarButton>
        <ToolbarButton
          label="Liste à puces"
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="size-4" aria-hidden />
        </ToolbarButton>
        <ToolbarButton
          label="Liste numérotée"
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="size-4" aria-hidden />
        </ToolbarButton>
        {(["small", "normal", "large"] as const).map((size) => (
          <button
            key={size}
            type="button"
            onClick={() => setFontSize(size)}
            className="cursor-pointer rounded-sm border border-border bg-surface px-2 py-1 text-xs font-semibold text-muted hover:bg-warm"
          >
            {size === "small" ? "Petit" : size === "large" ? "Grand" : "Normal"}
          </button>
        ))}
      </div>
      <div
        className={cn(
          "rounded-sm border border-border bg-surface transition-colors",
          "focus-within:border-purple focus-within:ring-2 focus-within:ring-purple/20",
          "[&_.ProseMirror]:cursor-text",
          "[&_.ProseMirror_p]:!m-0",
          "[&_.ProseMirror_ul]:my-1",
          "[&_.ProseMirror_ol]:my-1",
          "[&_.ProseMirror_ul]:list-disc",
          "[&_.ProseMirror_ol]:list-decimal",
          "[&_.ProseMirror_ul]:pl-5",
          "[&_.ProseMirror_ol]:pl-5",
        )}
        onMouseDown={(event) => {
          const target = event.target as HTMLElement;
          if (!target.closest(".ProseMirror")) {
            event.preventDefault();
            editor.chain().focus("end").run();
          }
        }}
      >
        <EditorContent
          editor={editor}
          className={prospectNotesProseClassName}
        />
      </div>
    </div>
  );
}
