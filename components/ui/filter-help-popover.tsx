"use client";

import { Info } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export function FilterHelpPopover() {
  return (
    <Popover>
      <PopoverTrigger
        render={
          <button
            type="button"
            aria-label="Aide sur l'utilisation des filtres"
            className="inline-flex cursor-pointer items-center justify-center rounded-full p-0.5 text-muted transition hover:bg-warm hover:text-text"
          >
            <Info className="size-3.5" aria-hidden />
          </button>
        }
      />
      <PopoverContent
        side="bottom"
        align="start"
        sideOffset={6}
        className="w-64 rounded-sm p-3"
      >
        <div className="space-y-0.5">
          <p className="text-[11px] font-medium leading-snug text-muted">
            Multisélection en cliquant sur la case à cocher
          </p>
          <p className="text-[11px] font-medium leading-snug text-muted">
            Sélection unique en cliquant sur la ligne
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
