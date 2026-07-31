import { cn } from "@/lib/utils/cn";
import { splitTextWithUrls } from "@/lib/utils/linkify-text";

type Props = {
  text: string;
  className?: string;
  linkClassName?: string;
};

export function LinkifiedText({
  text,
  className,
  linkClassName = "text-purple underline",
}: Props) {
  const segments = splitTextWithUrls(text);

  return (
    <p className={cn("break-words", className)}>
      {segments.map((segment, index) =>
        segment.kind === "url" ? (
          <a
            key={`url-${index}`}
            href={segment.href}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(linkClassName)}
          >
            {segment.value}
          </a>
        ) : (
          <span key={`text-${index}`}>{segment.value}</span>
        ),
      )}
    </p>
  );
}
