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

/** Sanitize HTML fragments (legal docs, user-facing content). Strips document structure. */
export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
  });
}

const EMAIL_ALLOWED_TAGS = [
  ...ALLOWED_TAGS,
  "html",
  "head",
  "body",
  "style",
  "meta",
  "title",
  "link",
  "center",
];

const EMAIL_ALLOWED_ATTR = [
  ...ALLOWED_ATTR,
  "style",
  "align",
  "valign",
  "bgcolor",
  "border",
  "cellpadding",
  "cellspacing",
  "charset",
  "name",
  "content",
  "http-equiv",
  "role",
  "aria-label",
  "dir",
  "lang",
  "xmlns",
  "colspan",
  "rowspan",
];

/**
 * Sanitize a full email HTML document (platform admin templates).
 * Preserves document structure (DOCTYPE, head, style, body) and inline styles
 * needed for email client rendering.
 */
export function sanitizeEmailHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: EMAIL_ALLOWED_TAGS,
    ALLOWED_ATTR: EMAIL_ALLOWED_ATTR,
    WHOLE_DOCUMENT: true,
    ALLOW_UNKNOWN_PROTOCOLS: false,
  });
}
