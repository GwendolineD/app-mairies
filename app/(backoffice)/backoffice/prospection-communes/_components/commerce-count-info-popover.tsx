"use client";

import { Info } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils/cn";

export const COMMERCE_LOOKUP_URL = "https://annuaire-entreprises.data.gouv.fr/";

export function CommerceCountInfoPopover() {
  const [copied, setCopied] = useState(false);

  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(COMMERCE_LOOKUP_URL);
      setCopied(true);
      toast.success("Lien copié dans le presse-papier.");
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Impossible de copier le lien.");
    }
  }

  return (
    <Popover>
      <PopoverTrigger
        render={
          <button
            type="button"
            className="inline-flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-sm text-subtle transition hover:bg-warm hover:text-purple"
            aria-label="Comment compter les commerces manuellement"
          />
        }
      >
        <Info className="size-3.5" aria-hidden />
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="start"
        sideOffset={6}
        className="w-72 max-w-[min(calc(100vw-2rem),18rem)] space-y-2 rounded-sm p-3"
      >
        <p className="text-sm text-text">
          Recherchez les établissements par commune sur l&apos;annuaire officiel,
          puis saisissez le nombre ici. Filtrez par activité (NAF) si besoin.
        </p>
        <button
          type="button"
          onClick={() => void copyUrl()}
          className={cn(
            "cursor-pointer break-all text-left text-sm font-medium text-purple underline-offset-2 hover:underline",
            copied && "text-mint",
          )}
          aria-label="Copier le lien vers l'annuaire des entreprises"
        >
          {COMMERCE_LOOKUP_URL}
        </button>
        {copied ? (
          <p className="text-xs font-medium text-mint">Copié !</p>
        ) : (
          <p className="text-xs text-muted">Cliquer pour copier le lien</p>
        )}
      </PopoverContent>
    </Popover>
  );
}
