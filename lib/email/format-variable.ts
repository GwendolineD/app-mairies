/** Escape HTML special characters for safe insertion in email templates. */
export function escapeHtml(value: string): string {
  return value.replace(/[<>&"']/g, (char) => `&#${char.charCodeAt(0)};`);
}

/** Format a template variable for insertion in an HTML email body. */
export function formatEmailHtmlVariable(
  value: string | number | undefined,
): string {
  if (value === undefined) return "";
  return escapeHtml(String(value))
    .replace(/\r\n/g, "\n")
    .replace(/\n/g, "<br>");
}

/** Format a template variable for insertion in an email subject line. */
export function formatEmailSubjectVariable(
  value: string | number | undefined,
): string {
  if (value === undefined) return "";
  return String(value).replace(/\r?\n/g, " ").trim();
}
