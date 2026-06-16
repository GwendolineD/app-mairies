import { MapPin } from "lucide-react";
import type { AddressLines } from "@/lib/utils/format-address";

type Props = AddressLines & {
  className?: string;
};

export function AnnouncementAddressLines({
  streetLine,
  cityLine,
  fallback,
  className,
}: Props) {
  const label = fallback ?? streetLine ?? cityLine ?? "";

  return (
    <p className={`inline-flex items-start gap-1.5 text-sm text-muted ${className ?? ""}`}>
      <MapPin className="mt-0.5 size-3.5 shrink-0 text-subtle" aria-hidden />
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
