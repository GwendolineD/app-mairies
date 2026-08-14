import type { JSONContent } from "@tiptap/core";
import { Extension, Mark } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";

export const PROSPECT_NOTE_FONT_SIZES = ["small", "normal", "large"] as const;
export type ProspectNoteFontSize = (typeof PROSPECT_NOTE_FONT_SIZES)[number];

export const PROSPECT_FONT_SIZE_MARK = "prospectFontSize";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    prospectFontSize: {
      setProspectFontSize: (size: ProspectNoteFontSize) => ReturnType;
    };
  }
}

/** Legacy paragraph attribute — kept for notes saved before mark-based sizing. */
const ProspectParagraphFontSize = Extension.create({
  name: "prospectParagraphFontSize",
  addGlobalAttributes() {
    return [
      {
        types: ["paragraph"],
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (element) =>
              element.getAttribute("data-font-size") ?? null,
            renderHTML: (attributes) => {
              const size = attributes.fontSize as ProspectNoteFontSize | null;
              if (!size || size === "normal") return {};
              return { "data-font-size": size };
            },
          },
        },
      },
    ];
  },
});

export const ProspectFontSizeMark = Mark.create({
  name: PROSPECT_FONT_SIZE_MARK,
  inclusive: false,
  addAttributes() {
    return {
      size: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-font-size"),
        renderHTML: (attributes) => {
          const size = attributes.size as ProspectNoteFontSize | null;
          if (!size || size === "normal") return {};
          return { "data-font-size": size };
        },
      },
    };
  },
  parseHTML() {
    return [{ tag: "span[data-font-size]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["span", HTMLAttributes, 0];
  },
  addCommands() {
    return {
      setProspectFontSize:
        (size: ProspectNoteFontSize) =>
        ({ chain, state, tr, dispatch }) => {
          if (size === "normal") {
            return chain().focus().unsetMark(PROSPECT_FONT_SIZE_MARK).run();
          }

          const { empty, from, to } = state.selection;
          if (!empty) {
            return chain()
              .focus()
              .setMark(PROSPECT_FONT_SIZE_MARK, { size })
              .run();
          }

          const $from = state.selection.$from;
          if ($from.parent.type.name !== "paragraph") {
            return chain()
              .focus()
              .setMark(PROSPECT_FONT_SIZE_MARK, { size })
              .run();
          }

          const paragraphFrom = $from.start();
          const paragraphTo = $from.end();
          if (paragraphFrom === paragraphTo) {
            return chain()
              .focus()
              .setMark(PROSPECT_FONT_SIZE_MARK, { size })
              .run();
          }

          if (dispatch) {
            tr.addMark(
              paragraphFrom,
              paragraphTo,
              state.schema.marks[PROSPECT_FONT_SIZE_MARK].create({ size }),
            );
          }
          return true;
        },
    };
  },
});

export const prospectNotesEditorExtensions = [
  StarterKit.configure({
    blockquote: false,
    code: false,
    codeBlock: false,
    heading: false,
    horizontalRule: false,
    strike: false,
    link: false,
    underline: false,
    bulletList: {
      keepMarks: true,
      keepAttributes: true,
    },
    orderedList: {
      keepMarks: true,
      keepAttributes: true,
    },
  }),
  ProspectParagraphFontSize,
  ProspectFontSizeMark,
];

export const prospectNotesProseClassName =
  "prospect-notes-editor max-w-none [&_.ProseMirror_[data-font-size=small]]:text-sm [&_.ProseMirror_[data-font-size=large]]:text-lg";

const ALLOWED_NODE_TYPES = new Set([
  "doc",
  "paragraph",
  "text",
  "bulletList",
  "orderedList",
  "listItem",
]);

const ALLOWED_MARKS = new Set(["bold", "italic", PROSPECT_FONT_SIZE_MARK]);

function sanitizeMark(
  mark: JSONContent,
): { type: string; attrs?: Record<string, unknown> } | null {
  if (!mark.type || !ALLOWED_MARKS.has(mark.type)) return null;
  if (mark.type === PROSPECT_FONT_SIZE_MARK) {
    const size = mark.attrs?.size;
    if (size !== "small" && size !== "large") return null;
    return { type: mark.type, attrs: { size } };
  }
  return { type: mark.type };
}

/** Strip React/Next client references before reading TipTap JSON on the server. */
function toPlainNotesJson(
  value: Record<string, unknown> | null | undefined,
): JSONContent | null {
  if (!value || typeof value !== "object") return null;
  try {
    return JSON.parse(JSON.stringify(value)) as JSONContent;
  } catch {
    return null;
  }
}

function sanitizeNode(node: JSONContent): JSONContent | null {
  if (!node.type || !ALLOWED_NODE_TYPES.has(node.type)) {
    return null;
  }

  const next: JSONContent = { type: node.type };

  if (node.type === "paragraph") {
    const attrs =
      node.attrs && typeof node.attrs === "object"
        ? (node.attrs as Record<string, unknown>)
        : null;
    const fontSize = attrs?.fontSize;
    if (
      fontSize === "small" ||
      fontSize === "normal" ||
      fontSize === "large"
    ) {
      next.attrs = { fontSize };
    }
  }

  if (node.content) {
    const children = node.content
      .map((child) => sanitizeNode(child))
      .filter((child): child is JSONContent => child != null);
    if (children.length > 0) {
      next.content = children;
    }
  }

  if (node.type === "text") {
    next.text = typeof node.text === "string" ? node.text : "";
    if (node.marks) {
      next.marks = node.marks
        .map((mark) => sanitizeMark(mark))
        .filter((mark): mark is { type: string; attrs?: Record<string, unknown> } => mark != null);
    }
  }

  return next;
}

export function sanitizeProspectNotesJson(
  value: Record<string, unknown> | null | undefined,
): Record<string, unknown> {
  const plain = toPlainNotesJson(value);
  if (!plain) {
    return { type: "doc", content: [] };
  }
  const sanitized = sanitizeNode(plain);
  if (!sanitized || sanitized.type !== "doc") {
    return { type: "doc", content: [] };
  }
  return sanitized as Record<string, unknown>;
}

export function hasProspectNotesContent(
  value: Record<string, unknown> | null | undefined,
): boolean {
  if (!value || value.type !== "doc") return false;
  const content = value.content;
  return Array.isArray(content) && content.length > 0;
}

export function resolveProspectNoteFontSize(
  marks: JSONContent["marks"] | undefined,
  paragraphAttrs?: JSONContent["attrs"],
): ProspectNoteFontSize | undefined {
  const sizeMark = marks?.find((mark) => mark.type === PROSPECT_FONT_SIZE_MARK);
  const markSize = sizeMark?.attrs?.size;
  if (markSize === "small" || markSize === "large") {
    return markSize;
  }

  const legacySize = paragraphAttrs?.fontSize;
  if (
    legacySize === "small" ||
    legacySize === "normal" ||
    legacySize === "large"
  ) {
    return legacySize;
  }

  return undefined;
}
