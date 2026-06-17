// @ts-nocheck
import { cn } from "@/lib/utils/cn";
import {
  PAYMENT_STATUS_LABEL,
  SUBSCRIPTION_STATUS_LABEL,
} from "@/lib/constants/statuses";

const SUBSCRIPTION_TONE: Record<string, string> = {
  active: "bg-mint/15 text-mint",
  trial: "bg-sun/20 text-orange",
  inactive: "bg-warm text-muted",
  suspended: "bg-coral/10 text-coral",
};

const MEMBERSHIP_TONE: Record<string, string> = {
  active: "bg-mint/15 text-mint",
  suspended: "bg-coral/10 text-coral",
  left: "bg-warm text-muted",
};

const MEMBERSHIP_LABEL: Record<string, string> = {
  active: "Actif",
  suspended: "Suspendu",
  left: "Parti",
};

const PAYMENT_TONE: Record<string, string> = {
  paid: "bg-mint/15 text-mint",
  pending: "bg-sun/20 text-orange",
  failed: "bg-coral/10 text-coral",
  refunded: "bg-warm text-muted",
};

const baseClass =
  "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold";

export function SubscriptionBadge({ status }: { status: string }) {
  return (
    <span className={cn(baseClass, SUBSCRIPTION_TONE[status] ?? "bg-warm text-muted")}>
      {SUBSCRIPTION_STATUS_LABEL[status] ?? status}
    </span>
  );
}

export function MembershipBadge({ status }: { status: string }) {
  return (
    <span className={cn(baseClass, MEMBERSHIP_TONE[status] ?? "bg-warm text-muted")}>
      {MEMBERSHIP_LABEL[status] ?? status}
    </span>
  );
}

export function PaymentBadge({ status }: { status: string }) {
  return (
    <span className={cn(baseClass, PAYMENT_TONE[status] ?? "bg-warm text-muted")}>
      {PAYMENT_STATUS_LABEL[status] ?? status}
    </span>
  );
}
