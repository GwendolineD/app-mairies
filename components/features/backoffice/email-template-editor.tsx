"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { updateEmailTemplate } from "@/lib/actions/platform";
import { EmailTemplateVariablesPopover } from "@/components/features/backoffice/email-template-variables-popover";
import {
  getEmailTemplateMockValue,
  getEmailTemplateVariables,
} from "@/lib/constants/email-template-variables";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import type { EmailTemplateRow } from "@/lib/queries/email-templates";

type Props = {
  template: EmailTemplateRow;
};

type EditorTab = "edit" | "preview";

function renderPreviewHtml(bodyHtml: string, slug: string): string {
  const variables = getEmailTemplateVariables(slug);
  let html = bodyHtml;
  for (const variable of variables) {
    const regex = new RegExp(`\\{\\{${variable}\\}\\}`, "g");
    html = html.replace(regex, getEmailTemplateMockValue(variable));
  }
  return html;
}

export function EmailTemplateEditor({ template }: Props) {
  const router = useRouter();
  const [subject, setSubject] = useState(template.subject);
  const [bodyHtml, setBodyHtml] = useState(template.body_html);
  const [savedSubject, setSavedSubject] = useState(template.subject);
  const [savedBodyHtml, setSavedBodyHtml] = useState(template.body_html);
  const [activeTab, setActiveTab] = useState<EditorTab>("edit");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const hasChanges =
    subject !== savedSubject || bodyHtml !== savedBodyHtml;

  useEffect(() => {
    if (activeTab !== "preview" || !iframeRef.current) return;

    const doc = iframeRef.current.contentDocument;
    if (!doc) return;

    doc.open();
    doc.write(renderPreviewHtml(bodyHtml, template.slug));
    doc.close();
  }, [activeTab, bodyHtml, template.slug]);

  function handleSave() {
    if (!hasChanges || isPending) return;

    setError(null);
    setSuccess(false);

    startTransition(async () => {
      const result = await updateEmailTemplate(template.slug, {
        subject,
        bodyHtml,
      });
      if (!result.success) {
        setError(result.error);
        return;
      }
      setSavedSubject(subject);
      setSavedBodyHtml(bodyHtml);
      setSuccess(true);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
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
          onChange={(e) => {
            setSubject(e.target.value);
            setSuccess(false);
          }}
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
            onChange={(e) => {
              setBodyHtml(e.target.value);
              setSuccess(false);
            }}
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

      {success ? (
        <p className="text-sm font-medium text-mint">Template enregistré !</p>
      ) : null}

      <div className="flex justify-end">
        <Button
          type="button"
          variant="primary"
          disabled={!hasChanges || isPending}
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
    </div>
  );
}
