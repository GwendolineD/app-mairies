import { MapPin } from "lucide-react";
import type { AddressLines } from "@/lib/utils/format-address";
import { cn } from "@/lib/utils/cn";

type Props = AddressLines & {
  className?: string;
  size?: "sm" | "md";
};

const SIZE_STYLES = {
  sm: {
    text: "text-sm",
    icon: "mt-0.5 size-3.5",
  },
  md: {
    text: "text-base leading-6",
    icon: "mt-1 size-4",
  },
} as const;

export function AnnouncementAddressLines({
  streetLine,
  cityLine,
  fallback,
  className,
  size = "sm",
}: Props) {
  const label = fallback ?? streetLine ?? cityLine ?? "";
  const styles = SIZE_STYLES[size];

  return (
    <p
      className={cn(
        "inline-flex items-start gap-1.5 text-muted",
        styles.text,
        className,
      )}
    >
      <MapPin
        className={cn("shrink-0 text-subtle", styles.icon)}
        aria-hidden
      />
      {fallback ? (
        <span>{label}</span>
      ) : (
        <span className="flex flex-col">
          {streetLine ? <span>{streetLine}</span> : null}
          {cityLine ? <span>{cityLine}</span> : null}
        </span>
      )}
    </p>
  );
}
