"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { updateEmailTemplate } from "@/lib/actions/platform";
import { EmailTemplateVariablesPopover } from "@/components/features/backoffice/email-template-variables-popover";
import { formatEmailHtmlVariable } from "@/lib/email/format-variable";
import {
  getEmailTemplateMockValue,
  getEmailTemplateVariables,
} from "@/lib/constants/email-template-variables";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form-field";
import { PageHeading } from "@/components/ui/page-heading";
import { cn } from "@/lib/utils/cn";
import type { EmailTemplateRow } from "@/lib/queries/email-templates";

type Props = {
  template: EmailTemplateRow;
};

type EditorTab = "edit" | "preview";

const DESCRIPTION_PLACEHOLDER = "Cliquez pour ajouter une description";

function normalizeDescription(value: string): string | null {
  return value.trim() || null;
}

function renderPreviewHtml(bodyHtml: string, slug: string): string {
  const variables = getEmailTemplateVariables(slug);
  let html = bodyHtml;
  for (const variable of variables) {
    const regex = new RegExp(`\\{\\{${variable}\\}\\}`, "g");
    html = html.replace(
      regex,
      formatEmailHtmlVariable(getEmailTemplateMockValue(variable)),
    );
  }
  return html;
}

export function EmailTemplateEditor({ template }: Props) {
  const router = useRouter();
  const [subject, setSubject] = useState(template.subject);
  const [bodyHtml, setBodyHtml] = useState(template.body_html);
  const [description, setDescription] = useState(template.description ?? "");
  const [savedSubject, setSavedSubject] = useState(template.subject);
  const [savedBodyHtml, setSavedBodyHtml] = useState(template.body_html);
  const [savedDescription, setSavedDescription] = useState(
    template.description ?? "",
  );
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [activeTab, setActiveTab] = useState<EditorTab>("edit");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isMounted, setIsMounted] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const hasChanges =
    subject !== savedSubject ||
    bodyHtml !== savedBodyHtml ||
    description !== savedDescription;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    setSubject(template.subject);
    setBodyHtml(template.body_html);
    setDescription(template.description ?? "");
    setSavedSubject(template.subject);
    setSavedBodyHtml(template.body_html);
    setSavedDescription(template.description ?? "");
    setIsEditingDescription(false);
  }, [template.subject, template.body_html, template.description]);

  useEffect(() => {
    if (activeTab !== "preview" || !iframeRef.current) return;

    const doc = iframeRef.current.contentDocument;
    if (!doc) return;

    doc.open();
    doc.write(renderPreviewHtml(bodyHtml, template.slug));
    doc.close();
  }, [activeTab, bodyHtml, template.slug]);

  function handleCancel() {
    setSubject(savedSubject);
    setBodyHtml(savedBodyHtml);
    setDescription(savedDescription);
    setIsEditingDescription(false);
    setError(null);
  }

  function handleSave() {
    if (!hasChanges || isPending) return;

    setError(null);
    const normalizedDescription = normalizeDescription(description);

    startTransition(async () => {
      const result = await updateEmailTemplate(template.slug, {
        subject,
        bodyHtml,
        description: normalizedDescription,
      });
      if (!result.success) {
        setError(result.error);
        return;
      }

      setSavedSubject(subject);
      setSavedBodyHtml(bodyHtml);
      setSavedDescription(description);
      setIsEditingDescription(false);
      router.refresh();
    });
  }

  const descriptionSubtitle = isEditingDescription ? (
    <div className="mt-2">
      <Input
        autoFocus
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            setIsEditingDescription(false);
          }
        }}
        placeholder={DESCRIPTION_PLACEHOLDER}
        className="max-w-2xl"
        aria-label="Description du template"
      />
    </div>
  ) : (
    <button
      type="button"
      onClick={() => setIsEditingDescription(true)}
      className={cn(
        "mt-2 block w-full max-w-2xl cursor-pointer text-left text-sm font-medium leading-5 transition hover:text-text",
        description.trim() ? "text-muted" : "text-subtle italic",
      )}
      title="Cliquez pour modifier"
    >
      {description.trim() || DESCRIPTION_PLACEHOLDER}
    </button>
  );

  return (
    <>
      <div className={cn("space-y-6", hasChanges && "pb-24")}>
        <PageHeading
          title={`Template : ${template.slug}`}
          subtitle={descriptionSubtitle}
        />

        <div>
          <label
            htmlFor="template-subject"
            className="mb-1.5 block text-sm font-medium text-text"
          >
            Sujet
          </label>
          <input
            id="template-subject"
            type="text"
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm outline-none transition focus:border-purple"
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2 border-b border-border">
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setActiveTab("edit")}
                className={cn(
                  "cursor-pointer border-b-2 px-4 py-2 text-sm font-medium transition",
                  activeTab === "edit"
                    ? "border-purple text-purple"
                    : "border-transparent text-muted hover:text-text",
                )}
              >
                Contenu HTML
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("preview")}
                className={cn(
                  "cursor-pointer border-b-2 px-4 py-2 text-sm font-medium transition",
                  activeTab === "preview"
                    ? "border-purple text-purple"
                    : "border-transparent text-muted hover:text-text",
                )}
              >
                Aperçu
              </button>
            </div>
            <EmailTemplateVariablesPopover slug={template.slug} />
          </div>

          {activeTab === "edit" ? (
            <textarea
              id="template-body"
              rows={24}
              value={bodyHtml}
              onChange={(event) => setBodyHtml(event.target.value)}
              className="w-full rounded-sm border border-border bg-surface px-3 py-2 font-mono text-xs outline-none transition focus:border-purple"
            />
          ) : (
            <div className="rounded-lg border border-border bg-white">
              <iframe
                ref={iframeRef}
                title="Aperçu du template"
                className="h-[600px] w-full rounded-lg"
                sandbox="allow-same-origin"
              />
            </div>
          )}
        </div>

        {error ? (
          <p className="text-sm font-medium text-coral" role="alert">
            {error}
          </p>
        ) : null}
      </div>

      {hasChanges && isMounted
        ? createPortal(
            <div className="fixed inset-x-0 bottom-[calc(60px+env(safe-area-inset-bottom,0))] z-50 border-t border-border/80 bg-surface/95 px-5 py-3 backdrop-blur md:bottom-0 md:px-6 lg:px-8">
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={isPending}
                  onClick={handleCancel}
                >
                  Annuler
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  disabled={isPending}
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
            document.body,
          )
        : null}
    </>
  );
}
