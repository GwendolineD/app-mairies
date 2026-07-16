/** Normalize line endings from textarea input for consistent display. */
export function normalizeMultilineText(value: string): string {
  return value.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

/** Trim outer whitespace while preserving internal line breaks. */
export function getTrimmedMultilineText(
  value: string | null | undefined,
): string | null {
  if (value == null) return null;
  const normalized = normalizeMultilineText(value).trim();
  return normalized.length > 0 ? normalized : null;
}
