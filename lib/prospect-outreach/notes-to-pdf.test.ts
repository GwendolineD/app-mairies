import { describe, expect, it } from "vitest";
import { sanitizeProspectNotesJson } from "@/lib/prospect-outreach/notes-editor-config";
import { prospectNotesToPlainText } from "@/lib/prospect-outreach/notes-to-pdf";

describe("prospectNotesToPlainText", () => {
  it("preserves multiple paragraph breaks", () => {
    const notes = {
      type: "doc",
      content: [
        { type: "paragraph", content: [{ type: "text", text: "Ligne 1" }] },
        { type: "paragraph", content: [{ type: "text", text: "Ligne 2" }] },
      ],
    };

    expect(prospectNotesToPlainText(notes)).toBe("Ligne 1\nLigne 2");
  });

  it("preserves hardBreak inline breaks", () => {
    const notes = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            { type: "text", text: "Avant" },
            { type: "hardBreak" },
            { type: "text", text: "Après" },
          ],
        },
      ],
    };

    expect(prospectNotesToPlainText(notes)).toBe("Avant\nAprès");
  });

  it("renders empty paragraphs as blank lines", () => {
    const notes = {
      type: "doc",
      content: [
        { type: "paragraph", content: [{ type: "text", text: "Haut" }] },
        { type: "paragraph" },
        { type: "paragraph", content: [{ type: "text", text: "Bas" }] },
      ],
    };

    expect(prospectNotesToPlainText(notes)).toBe("Haut\n\u00A0\nBas");
  });
});

describe("sanitizeProspectNotesJson hardBreak", () => {
  it("keeps hardBreak nodes when saving", () => {
    const input = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            { type: "text", text: "A" },
            { type: "hardBreak" },
            { type: "text", text: "B" },
          ],
        },
      ],
    };

    const sanitized = sanitizeProspectNotesJson(input);
    const paragraph = (sanitized.content as { content: unknown[] }[])[0];
    expect(paragraph.content).toEqual([
      { type: "text", text: "A" },
      { type: "hardBreak" },
      { type: "text", text: "B" },
    ]);
  });
});
