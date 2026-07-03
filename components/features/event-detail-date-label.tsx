import { getEventDetailParts } from "@/lib/datetime";
import { cn } from "@/lib/utils/cn";

type Props = {
  start: string;
  end: string;
  className?: string;
};

/** Event detail schedule — bold dates/times, regular connectors (Du, au, à…). */
export function EventDetailDateLabel({ start, end, className }: Props) {
  const parts = getEventDetailParts(start, end);

  return (
    <p className={cn("text-base text-orange", className)}>
      {parts.map((part, index) => (
        <span
          key={index}
          className={
            part.variant === "connector"
              ? "font-normal text-orange/90"
              : "font-semibold"
          }
        >
          {part.text}
        </span>
      ))}
    </p>
  );
}
