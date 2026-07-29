"use client";

import { Info } from "lucide-react";
import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { getEmailTemplateVariables } from "@/lib/constants/email-template-variables";
import { cn } from "@/lib/utils/cn";

type Props = {
  slug: string;
  onInsert?: (text: string) => void;
};

function VariableChip({
  variable,
  onInsert,
}: {
  variable: string;
  onInsert?: (text: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const value = `{{${variable}}}`;

  async function handleClick() {
    if (onInsert) {
      onInsert(value);
      return;
    }
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API unavailable
    }
  }

  return (
    <button
      type="button"
      onClick={() => void handleClick()}
      className={cn(
        "cursor-pointer rounded bg-warm px-2 py-1 text-xs font-medium text-purple transition hover:bg-soft-pink",
        copied && "bg-mint/15 text-mint",
      )}
      aria-label={onInsert ? `Insérer ${value}` : `Copier ${value}`}
    >
      <code>{value}</code>
    </button>
  );
}

export function EmailTemplateVariablesPopover({ slug, onInsert }: Props) {
  const variables = getEmailTemplateVariables(slug);

  return (
    <Popover>
      <PopoverTrigger
        render={
          <button
            type="button"
            className="inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted transition hover:bg-warm hover:text-purple md:size-6"
            aria-label="Variables disponibles pour ce template"
          />
        }
      >
        <Info className="size-4" aria-hidden />
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={8} className="w-72 rounded-sm p-4">
        <p className="mb-2 text-xs font-semibold uppercase text-muted">
          {onInsert ? "Insérer une variable" : "Variables disponibles"}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {variables.map((variable) => (
            <VariableChip
              key={variable}
              variable={variable}
              onInsert={onInsert}
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
