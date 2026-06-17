"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { suspendContent } from "@/lib/actions/moderation";
import { resolveReportAction } from "@/lib/actions/municipality";
import type { ConversationContextType } from "@/lib/types";

type Props = {
  reportId: string;
  contextType: string;
  contextId: string;
};

export function BackofficeReportActions({ reportId, contextType, contextId }: Props) {
  const [busy, run] = useTransition();

  function handleSuspendContent() {
    if (contextType === "user") return;
    run(async () => {
      const result = await suspendContent(
        contextType as ConversationContextType,
        contextId,
        "Suspendu suite à un signalement (backoffice)",
        reportId,
      );
      if (result.success) {
        await resolveReportAction(reportId, "content_suspended");
      }
    });
  }

  function handleDismiss() {
    run(async () => {
      await resolveReportAction(reportId, "dismissed");
    });
  }

  return (
    <div className="flex flex-wrap gap-2 pt-1">
      {contextType !== "user" && (
        <Button
          type="button"
          variant="primary"
          size="sm"
          disabled={busy}
          onClick={handleSuspendContent}
        >
          Suspendre le contenu
        </Button>
      )}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={busy}
        onClick={handleDismiss}
      >
        Ignorer
      </Button>
    </div>
  );
}
