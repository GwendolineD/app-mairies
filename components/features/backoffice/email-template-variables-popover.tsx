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
};

function VariableChip({ variable }: { variable: string }) {
  const [copied, setCopied] = useState(false);
  const value = `{{${variable}}}`;

  async function handleCopy() {
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
      onClick={() => void handleCopy()}
      className={cn(
        "cursor-pointer rounded bg-warm px-2 py-1 text-xs font-medium text-purple transition hover:bg-soft-pink",
        copied && "bg-mint/15 text-mint",
      )}
      aria-label={`Copier ${value}`}
    >
      <code>{value}</code>
    </button>
  );
}

export function EmailTemplateVariablesPopover({ slug }: Props) {
  const variables = getEmailTemplateVariables(slug);

  return (
    <Popover>
      <PopoverTrigger
        render={
          <button
            type="button"
            className="inline-flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted transition hover:bg-warm hover:text-purple"
            aria-label="Variables disponibles pour ce template"
          />
        }
      >
        <Info className="size-4" aria-hidden />
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={8} className="w-72 rounded-sm p-4">
        <p className="mb-2 text-xs font-semibold uppercase text-muted">
          Variables disponibles
        </p>
        <div className="flex flex-wrap gap-1.5">
          {variables.map((variable) => (
            <VariableChip key={variable} variable={variable} />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
