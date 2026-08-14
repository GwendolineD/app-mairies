import { Text, View, StyleSheet } from "@react-pdf/renderer";
import type { Style } from "@react-pdf/types";
import type { JSONContent } from "@tiptap/core";
import {
  type ProspectNoteFontSize,
  resolveProspectNoteFontSize,
} from "@/lib/prospect-outreach/notes-editor-config";

const styles = StyleSheet.create({
  paragraph: {
    fontSize: 11,
    lineHeight: 1,
    marginBottom: 1,
  },
  paragraphSmall: {
    fontSize: 9,
  },
  paragraphLarge: {
    fontSize: 13,
  },
  list: {
    marginBottom: 2,
    paddingLeft: 8,
  },
  listItem: {
    flexDirection: "row",
    marginBottom: 1,
  },
  bullet: {
    width: 12,
    fontSize: 11,
  },
});

function pdfFontSize(size?: ProspectNoteFontSize): number {
  if (size === "small") return 9;
  if (size === "large") return 13;
  return 11;
}

function fontSizeStyle(size?: ProspectNoteFontSize): Style[] {
  if (size === "small") return [styles.paragraph, styles.paragraphSmall];
  if (size === "large") return [styles.paragraph, styles.paragraphLarge];
  return [styles.paragraph];
}

function renderTextNode(node: JSONContent, key: string) {
  const text = node.text ?? "";
  const marks = node.marks ?? [];
  const bold = marks.some((mark) => mark.type === "bold");
  const italic = marks.some((mark) => mark.type === "italic");
  const size = resolveProspectNoteFontSize(marks);
  return (
    <Text
      key={key}
      style={{
        fontSize: pdfFontSize(size),
        fontWeight: bold ? "bold" : "normal",
        fontStyle: italic ? "italic" : "normal",
      }}
    >
      {text}
    </Text>
  );
}

function renderInlineContent(nodes: JSONContent[] | undefined, prefix: string) {
  if (!nodes?.length) return null;
  return nodes.map((node, index) => {
    if (node.type === "text") {
      return renderTextNode(node, `${prefix}-text-${index}`);
    }
    return null;
  });
}

function renderParagraphBlock(node: JSONContent, key: string) {
  const legacySize = resolveProspectNoteFontSize(undefined, node.attrs);
  const hasLegacyParagraphSize =
    legacySize &&
    legacySize !== "normal" &&
    !node.content?.some((child) =>
      child.marks?.some((mark) => mark.type === "prospectFontSize"),
    );

  if (hasLegacyParagraphSize) {
    return (
      <Text key={key} style={fontSizeStyle(legacySize)}>
        {renderInlineContent(node.content, key)}
      </Text>
    );
  }

  return (
    <Text key={key} style={styles.paragraph}>
      {renderInlineContent(node.content, key)}
    </Text>
  );
}

function renderBlock(node: JSONContent, key: string) {
  if (node.type === "paragraph") {
    return renderParagraphBlock(node, key);
  }

  if (node.type === "bulletList" || node.type === "orderedList") {
    return (
      <View key={key} style={styles.list}>
        {(node.content ?? []).map((item, index) => {
          if (item.type !== "listItem") return null;
          const paragraph = item.content?.find(
            (child) => child.type === "paragraph",
          );
          return (
            <View key={`${key}-item-${index}`} style={styles.listItem}>
              <Text style={styles.bullet}>
                {node.type === "orderedList" ? `${index + 1}.` : "•"}
              </Text>
              <Text style={styles.paragraph}>
                {renderInlineContent(paragraph?.content, `${key}-item-${index}`)}
              </Text>
            </View>
          );
        })}
      </View>
    );
  }

  return null;
}

export function ProspectNotesPdf({
  notesJson,
}: {
  notesJson: Record<string, unknown> | null;
}) {
  if (!notesJson || notesJson.type !== "doc") {
    return <Text style={styles.paragraph}>—</Text>;
  }

  const content = notesJson.content as JSONContent[] | undefined;
  if (!content?.length) {
    return <Text style={styles.paragraph}>—</Text>;
  }

  return (
    <View>
      {content.map((node, index) => renderBlock(node, `note-block-${index}`))}
    </View>
  );
}
