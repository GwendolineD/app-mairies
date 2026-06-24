"use client";

import { generateJSON } from "@tiptap/html";
import { EditorContent, useEditor } from "@tiptap/react";
import {
  Bold,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  List,
  ListOrdered,
  Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { updateLegalDocument } from "@/lib/actions/legal-documents";
import {
  legalDocumentEditorExtensions,
  legalDocumentProseClassName,
} from "@/lib/legal/editor-config";
import type { LegalDocumentSlug } from "@/lib/legal/seed-content";
import type { LegalDocument } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

type Props = {
  document: LegalDocument;
};

type ToolbarButtonProps = {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
};

function ToolbarButton({
  label,
  active,
  disabled,
  onClick,
  children,
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex size-8 cursor-pointer items-center justify-center rounded-sm border border-border bg-surface text-text transition hover:bg-warm disabled:cursor-not-allowed disabled:opacity-50",
        active && "border-purple bg-soft-pink text-purple",
      )}
    >
      {children}
    </button>
  );
}

function hasTiptapContent(contentJson: Record<string, unknown>): boolean {
  if (!contentJson || typeof contentJson !== "object") return false;
  if (contentJson.type !== "doc") return false;
  const content = contentJson.content;
  return Array.isArray(content) && content.length > 0;
}

export function LegalDocumentEditor({ document }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(document.title);
  const [savedTitle, setSavedTitle] = useState(document.title);
  const [savedContentHtml, setSavedContentHtml] = useState(document.content_html);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const initialContent = useMemo(() => {
    if (hasTiptapContent(document.content_json)) {
      return document.content_json;
    }

    return generateJSON(
      document.content_html,
      legalDocumentEditorExtensions,
    ) as Record<string, unknown>;
  }, [document.content_html, document.content_json]);

  const editor = useEditor({
    extensions: legalDocumentEditorExtensions,
    content: initialContent,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: cn(
          legalDocumentProseClassName,
          "min-h-[420px] rounded-sm border border-border bg-surface px-4 py-3 outline-none focus-visible:border-purple",
        ),
      },
    },
  });

  const hasChanges =
    title !== savedTitle ||
    (editor ? editor.getHTML() !== savedContentHtml : false);

  function handleSave() {
    if (!editor || !hasChanges || isPending) return;

    setError(null);
    setSuccess(false);

    const contentHtml = editor.getHTML();
    const contentJson = editor.getJSON() as Record<string, unknown>;

    startTransition(async () => {
      const result = await updateLegalDocument({
        slug: document.slug as LegalDocumentSlug,
        title,
        contentHtml,
        contentJson,
      });

      if (!result.success) {
        setError(result.error ?? "Enregistrement impossible.");
        return;
      }

      setSavedTitle(title);
      setSavedContentHtml(contentHtml);
      setSuccess(true);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label
          htmlFor="legal-document-title"
          className="text-sm font-semibold text-text"
        >
          Titre du document
        </label>
        <input
          id="legal-document-title"
          value={title}
          onChange={(event) => {
            setTitle(event.target.value);
            setSuccess(false);
          }}
          className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm font-medium text-text outline-none transition focus-visible:border-purple"
        />
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <ToolbarButton
            label="Titre principal"
            active={editor?.isActive("heading", { level: 1 }) ?? false}
            disabled={!editor || isPending}
            onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
          >
            <Heading1 className="size-4" aria-hidden />
          </ToolbarButton>
          <ToolbarButton
            label="Titre article"
            active={editor?.isActive("heading", { level: 2 }) ?? false}
            disabled={!editor || isPending}
            onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
          >
            <Heading2 className="size-4" aria-hidden />
          </ToolbarButton>
          <ToolbarButton
            label="Sous-titre"
            active={editor?.isActive("heading", { level: 3 }) ?? false}
            disabled={!editor || isPending}
            onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
          >
            <Heading3 className="size-4" aria-hidden />
          </ToolbarButton>
          <ToolbarButton
            label="Gras"
            active={editor?.isActive("bold") ?? false}
            disabled={!editor || isPending}
            onClick={() => editor?.chain().focus().toggleBold().run()}
          >
            <Bold className="size-4" aria-hidden />
          </ToolbarButton>
          <ToolbarButton
            label="Italique"
            active={editor?.isActive("italic") ?? false}
            disabled={!editor || isPending}
            onClick={() => editor?.chain().focus().toggleItalic().run()}
          >
            <Italic className="size-4" aria-hidden />
          </ToolbarButton>
          <ToolbarButton
            label="Liste à puces"
            active={editor?.isActive("bulletList") ?? false}
            disabled={!editor || isPending}
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
          >
            <List className="size-4" aria-hidden />
          </ToolbarButton>
          <ToolbarButton
            label="Liste numérotée"
            active={editor?.isActive("orderedList") ?? false}
            disabled={!editor || isPending}
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          >
            <ListOrdered className="size-4" aria-hidden />
          </ToolbarButton>
        </div>

        <EditorContent editor={editor} />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="primary"
          size="sm"
          disabled={!hasChanges || isPending || !editor}
          onClick={handleSave}
        >
          {isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Enregistrement…
            </>
          ) : (
            "Enregistrer"
          )}
        </Button>
        {success ? (
          <p className="text-sm font-medium text-mint">Document enregistré.</p>
        ) : null}
        {error ? (
          <p className="text-sm font-medium text-coral">{error}</p>
        ) : null}
      </div>
    </div>
  );
}
