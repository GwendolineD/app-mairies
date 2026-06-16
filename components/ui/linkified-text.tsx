import { cn } from "@/lib/utils/cn";
import { splitTextWithUrls } from "@/lib/utils/linkify-text";

type Props = {
  text: string;
  className?: string;
};

export function LinkifiedText({ text, className }: Props) {
  const segments = splitTextWithUrls(text);

  return (
    <p className={className}>
      {segments.map((segment, index) =>
        segment.kind === "url" ? (
          <a
            key={`url-${index}`}
            href={segment.href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple underline"
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
