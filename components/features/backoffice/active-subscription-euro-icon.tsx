"use client";

import { Euro } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils/cn";

type Props = {
  hasActiveSubscription: boolean;
  paymentStatus: "paid" | "unpaid" | null;
  className?: string;
};

function stopLinkNavigation(event: React.SyntheticEvent) {
  event.stopPropagation();
}

function subscriptionLabel(
  hasActiveSubscription: boolean,
  paymentStatus: "paid" | "unpaid" | null,
): string {
  if (!hasActiveSubscription || paymentStatus == null) {
    return "Aucun abonnement actif";
  }
  return paymentStatus === "paid"
    ? "Abonnement actif — payé"
    : "Abonnement actif — impayé";
}

export function ActiveSubscriptionEuroIcon({
  hasActiveSubscription,
  paymentStatus,
  className,
}: Props) {
  const label = subscriptionLabel(hasActiveSubscription, paymentStatus);
  const isPaid = paymentStatus === "paid";
  const hasSubscription = hasActiveSubscription && paymentStatus != null;

  return (
    <Popover>
      <PopoverTrigger
        nativeButton={false}
        render={
          <span
            role="button"
            tabIndex={0}
            className={cn(
              "inline-flex cursor-pointer items-center rounded-sm px-1 py-0.5 text-sm font-medium transition hover:bg-warm",
              className,
            )}
            aria-label={label}
            onClick={stopLinkNavigation}
            onPointerDown={stopLinkNavigation}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                stopLinkNavigation(event);
              }
            }}
          />
        }
      >
        {hasSubscription ? (
          <Euro
            className={cn(
              "size-4 shrink-0",
              isPaid ? "text-purple" : "text-purple opacity-40",
            )}
            aria-hidden
          />
        ) : (
          <span
            className="relative inline-flex size-4 shrink-0 items-center justify-center text-muted opacity-60"
            aria-hidden
          >
            <Euro className="size-4" />
            <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <span className="h-px w-[110%] rotate-45 rounded-full bg-current" />
            </span>
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="center"
        sideOffset={6}
        className="w-auto min-w-0 gap-0 border-0 p-0 shadow-md ring-1 ring-foreground/10"
      >
        <span className="whitespace-nowrap px-2.5 py-1.5 text-sm font-semibold text-text">
          {label}
        </span>
      </PopoverContent>
    </Popover>
  );
}
