"use client";

import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatHorairesDisplay } from "@/lib/prospect-communes/format-horaires-display";
import type { ProspectCommuneListItem } from "@/lib/prospect-communes/types";
import { cn } from "@/lib/utils/cn";
import { formatPopulationFr } from "@/lib/prospect-communes/format-population";

type BridgeProps = {
  pinX: number;
  pinY: number;
  cardX: number;
  cardY: number;
  cardWidth: number;
  cardHeight: number;
  pinHeight: number;
  placement: "above" | "below";
  onMouseEnter: () => void;
  onMouseLeave: () => void;
};

/** Invisible corridor between pin and card so the pointer can reach the card safely. */
export function ProspectionMapHoverBridge({
  pinX,
  pinY,
  cardX,
  cardY,
  cardWidth,
  cardHeight,
  pinHeight,
  placement,
  onMouseEnter,
  onMouseLeave,
}: BridgeProps) {
  const pinTop = pinY - pinHeight;
  const cardCenterX = cardX + cardWidth / 2;
  const bridgeLeft = Math.min(pinX, cardCenterX) - 24;
  const bridgeWidth = Math.abs(pinX - cardCenterX) + 48;

  const bridgeTop =
    placement === "above" ? cardY + cardHeight : pinY;
  const bridgeBottom =
    placement === "above" ? pinTop : cardY;
  const bridgeHeight = Math.max(bridgeBottom - bridgeTop, 8);

  return (
    <div
      className="pointer-events-auto absolute"
      style={{
        left: bridgeLeft,
        top: bridgeTop,
        width: bridgeWidth,
        height: bridgeHeight,
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      aria-hidden
    />
  );
}

type CardProps = {
  item: ProspectCommuneListItem;
  x: number;
  y: number;
  placement: "above" | "below";
  onOpenDetail: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
};

export function ProspectionMapHoverCard({
  item,
  x,
  y,
  placement,
  onOpenDetail,
  onMouseEnter,
  onMouseLeave,
}: CardProps) {
  return (
    <div
      className="pointer-events-auto absolute z-50 w-[220px] rounded-xl border border-border/70 bg-surface p-3 text-sm shadow-card"
      style={{ left: x, top: y }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div
        className={cn(
          "absolute left-1/2 size-2.5 -translate-x-1/2 rotate-45 border border-border/70 bg-surface",
          placement === "above"
            ? "-bottom-1.5 border-t-0 border-l-0"
            : "-top-1.5 border-r-0 border-b-0",
        )}
        aria-hidden
      />
      <div className="space-y-1">
        <div className="flex items-start justify-between gap-2">
          <p className="min-w-0 font-semibold leading-5 text-text">{item.commune}</p>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            className="cursor-pointer text-muted hover:text-purple"
            aria-label={`Ouvrir la fiche de ${item.commune}`}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onOpenDetail();
            }}
          >
            <ChevronRight className="size-4" aria-hidden />
          </Button>
        </div>
        <p className="text-muted">{formatPopulationFr(item.population)} hab.</p>
        <p className="text-muted">Maire : {item.maire ?? "—"}</p>
        <p className="text-xs leading-5 text-muted">
          {formatHorairesDisplay(item.horaires_ouverture)}
        </p>
      </div>
    </div>
  );
}
