import DOMPurify from "isomorphic-dompurify";

const ALLOWED_TAGS = [
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "p",
  "br",
  "hr",
  "strong",
  "em",
  "s",
  "u",
  "blockquote",
  "code",
  "pre",
  "ul",
  "ol",
  "li",
  "a",
  "span",
  "table",
  "thead",
  "tbody",
  "tr",
  "th",
  "td",
  "div",
  "img",
];

const ALLOWED_ATTR = ["href", "target", "rel", "class", "src", "alt", "width", "height"];

/** Sanitize HTML from admin editors (legal docs, email templates) before storage/display. */
export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
  });
}
