import { cn } from "@/lib/utils/cn";
import { getTrimmedMultilineText } from "@/lib/utils/multiline-text";

type Props = {
  text: string | null | undefined;
  className?: string;
};

/** Renders textarea-backed text with preserved line breaks. */
export function MultilineText({ text, className }: Props) {
  const normalized = getTrimmedMultilineText(text);
  if (!normalized) return null;

  return (
    <p className={cn("whitespace-pre-wrap break-words", className)}>{normalized}</p>
  );
}
