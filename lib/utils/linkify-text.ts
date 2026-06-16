export type TextSegment =
  | { kind: "text"; value: string }
  | { kind: "url"; value: string; href: string };

const URL_REGEX = /(?:https?:\/\/[^\s]+|www\.[^\s]+)/gi;

function trimTrailingUrlPunctuation(url: string): string {
  return url.replace(/[.,;:!?)]+$/, "");
}

function toHref(url: string): string {
  return url.startsWith("www.") ? `https://${url}` : url;
}

/** Splits plain text into text and URL segments for safe link rendering. */
export function splitTextWithUrls(text: string): TextSegment[] {
  const segments: TextSegment[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(URL_REGEX)) {
    const index = match.index ?? 0;
    if (index > lastIndex) {
      segments.push({ kind: "text", value: text.slice(lastIndex, index) });
    }

    const raw = match[0];
    const value = trimTrailingUrlPunctuation(raw);
    segments.push({ kind: "url", value, href: toHref(value) });
    lastIndex = index + raw.length;
  }

  if (lastIndex < text.length) {
    segments.push({ kind: "text", value: text.slice(lastIndex) });
  }

  return segments;
}
