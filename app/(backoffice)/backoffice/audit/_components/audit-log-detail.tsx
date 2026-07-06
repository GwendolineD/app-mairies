"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

type AuditLogDetailProps = {
  metadata: Record<string, unknown>;
  userAgent: string | null;
  success: boolean;
};

export function AuditLogDetail({
  metadata,
  userAgent,
  success,
}: AuditLogDetailProps) {
  const [open, setOpen] = useState(false);
  const hasMetadata = Object.keys(metadata).length > 0;

  if (!hasMetadata && !userAgent) {
    return null;
  }

  return (
    <div className="border-t border-border/60 pt-1.5">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-auto px-0 py-0 text-xs font-medium text-purple hover:bg-transparent hover:opacity-80"
        onClick={() => setOpen((value) => !value)}
      >
        {open ? (
          <ChevronUp className="mr-1 size-3.5" aria-hidden />
        ) : (
          <ChevronDown className="mr-1 size-3.5" aria-hidden />
        )}
        {open ? "Masquer le détail" : "Voir le détail"}
      </Button>

      {open ? (
        <div className="mt-3 space-y-3">
          <p className="text-xs font-medium text-muted">
            Statut :{" "}
            <span
              className={cn(
                "font-semibold",
                success ? "text-mint" : "text-coral",
              )}
            >
              {success ? "Succès" : "Échec"}
            </span>
          </p>

          {userAgent ? (
            <div>
              <p className="text-xs font-semibold text-subtle">User-Agent</p>
              <p className="mt-1 break-all text-xs font-medium text-muted">
                {userAgent}
              </p>
            </div>
          ) : null}

          {hasMetadata ? (
            <div>
              <p className="text-xs font-semibold text-subtle">Métadonnées</p>
              <pre className="mt-1 max-h-48 overflow-auto rounded-sm bg-warm p-3 text-xs font-medium text-text">
                {JSON.stringify(metadata, null, 2)}
              </pre>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
