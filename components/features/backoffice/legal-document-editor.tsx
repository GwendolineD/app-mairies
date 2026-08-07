"use client";

import { generateJSON } from "@tiptap/html";
import { EditorContent, useEditor } from "@tiptap/react";
import {
  Bold,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  Link2,
  List,
  ListOrdered,
  Loader2,
  Minus,
  Quote,
  Strikethrough,
  Underline,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { updateLegalDocument } from "@/lib/actions/legal-documents";
import {
  legalDocumentEditorExtensions,
  legalDocumentProseClassName,
} from "@/lib/legal/editor-config";
import type { LegalDocumentSlug } from "@/lib/legal/seed-content";
import type { LegalDocument } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { FormField, Input } from "@/components/ui/form-field";
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
        "inline-flex size-11 md:size-8 cursor-pointer items-center justify-center rounded-sm border border-border bg-surface text-text transition hover:bg-warm disabled:cursor-not-allowed disabled:opacity-50",
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
  const [isPending, startTransition] = useTransition();
  const [isMounted, setIsMounted] = useState(false);
  const [, setContentRevision] = useState(0);

  useEffect(() => {
    setIsMounted(true);
  }, []);

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
          "min-h-[50dvh] max-h-[70dvh] overflow-y-auto rounded-sm border border-border bg-surface px-4 py-3 outline-none focus-visible:border-purple",
        ),
      },
    },
    onUpdate: () => {
      setContentRevision((revision) => revision + 1);
    },
  });

  const hasChanges =
    title !== savedTitle ||
    (editor ? editor.getHTML() !== savedContentHtml : false);

  // Unsaved changes guard
  useEffect(() => {
    if (!hasChanges) return;
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault();
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasChanges]);

  function handleSave() {
    if (!editor || !hasChanges || isPending) return;

    setError(null);

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
        const msg = result.error ?? "Enregistrement impossible.";
        setError(msg);
        toast.error(msg);
        return;
      }

      setSavedTitle(title);
      setSavedContentHtml(contentHtml);
      toast.success("Document enregistré");
      router.refresh();
    });
  }

  function handleInsertLink() {
    if (!editor) return;
    const url = window.prompt("URL du lien :");
    if (!url) return;
    editor.chain().focus().setLink({ href: url }).run();
  }

  return (
    <div className={cn("space-y-6", hasChanges && "pb-24")}>
      <FormField label="Titre du document">
        <Input
          id="legal-document-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
      </FormField>

      <div className="space-y-3">
        <div className="sticky top-0 z-10 flex flex-wrap items-center gap-1.5 rounded-sm border border-border bg-surface/95 p-1.5 backdrop-blur md:gap-2 md:p-2">
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
            label="Souligné"
            active={editor?.isActive("underline") ?? false}
            disabled={!editor || isPending}
            onClick={() => editor?.chain().focus().toggleUnderline().run()}
          >
            <Underline className="size-4" aria-hidden />
          </ToolbarButton>
          <ToolbarButton
            label="Barré"
            active={editor?.isActive("strike") ?? false}
            disabled={!editor || isPending}
            onClick={() => editor?.chain().focus().toggleStrike().run()}
          >
            <Strikethrough className="size-4" aria-hidden />
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
          <ToolbarButton
            label="Citation"
            active={editor?.isActive("blockquote") ?? false}
            disabled={!editor || isPending}
            onClick={() => editor?.chain().focus().toggleBlockquote().run()}
          >
            <Quote className="size-4" aria-hidden />
          </ToolbarButton>
          <ToolbarButton
            label="Lien"
            active={editor?.isActive("link") ?? false}
            disabled={!editor || isPending}
            onClick={handleInsertLink}
          >
            <Link2 className="size-4" aria-hidden />
          </ToolbarButton>
          <ToolbarButton
            label="Séparateur"
            disabled={!editor || isPending}
            onClick={() => editor?.chain().focus().setHorizontalRule().run()}
          >
            <Minus className="size-4" aria-hidden />
          </ToolbarButton>
        </div>

        <EditorContent editor={editor} />
      </div>

      {error ? (
        <p className="text-sm font-medium text-coral" role="alert">{error}</p>
      ) : null}

      {hasChanges && isMounted
        ? createPortal(
            <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border/80 bg-surface/95 px-5 py-3 backdrop-blur md:px-6 lg:px-8">
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  disabled={isPending || !editor}
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
              </div>
            </div>,
            window.document.body,
          )
        : null}
    </div>
  );
}
