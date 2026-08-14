import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import type { ProspectCommuneDetail } from "@/lib/prospect-communes/types";
import { formatHorairesPdfLines } from "@/lib/prospect-communes/format-horaires-display";
import {
  PROSPECT_FIRST_CONTACT_TYPE_LABELS,
  PROSPECT_OUTCOME_LABELS,
} from "@/lib/prospect-outreach/types";
import { ProspectNotesPdf } from "@/lib/prospect-outreach/notes-to-pdf";

const styles = StyleSheet.create({
  page: {
    padding: 32,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#252630",
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: 12,
    marginBottom: 6,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: "bold",
    lineHeight: 1,
  },
  maire: {
    fontSize: 11,
    fontWeight: "bold",
    textAlign: "right",
    lineHeight: 1,
  },
  compactRow: {
    marginBottom: 0,
    lineHeight: 1,
  },
  horairesRow: {
    marginBottom: 1,
    lineHeight: 1.2,
    fontSize: 8,
    color: "#7D7E8D",
  },
  blankLine: {
    height: 4,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "bold",
    marginTop: 8,
    marginBottom: 9,
    color: "#9A52FF",
  },
  row: {
    marginBottom: 0,
    lineHeight: 1,
  },
  splitCol: {
    flex: 1,
  },
  label: {
    fontWeight: "bold",
  },
  role: {
    fontSize: 7,
    color: "#7D7E8D",
  },
  conseillerRow: {
    marginBottom: 1,
    lineHeight: 1.2,
    fontSize: 9,
  },
  conseillersGrid: {
    flexDirection: "row",
    gap: 16,
  },
  conseillersCol: {
    flex: 1,
  },
  suiviRow: {
    marginBottom: 1,
    lineHeight: 1.2,
    fontSize: 9,
  },
  suiviSplitRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
    marginBottom: 1,
    lineHeight: 1.2,
    fontSize: 9,
  },
});

function formatDate(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("fr-FR");
}

function splitInHalf<T>(items: T[]): [T[], T[]] {
  const mid = Math.ceil(items.length / 2);
  return [items.slice(0, mid), items.slice(mid)];
}

function HorairesPdfBlock({ lines }: { lines: string[] }) {
  if (lines.length === 0) {
    return <Text style={styles.horairesRow}>—</Text>;
  }

  return (
    <>
      {lines.map((line) => (
        <Text key={line} style={styles.horairesRow}>
          {line}
        </Text>
      ))}
    </>
  );
}

export function ProspectFichePdfDocument({
  detail,
}: {
  detail: ProspectCommuneDetail;
}) {
  const { outreach } = detail;
  const horairesLines = formatHorairesPdfLines(detail.horaires_ouverture);
  const [conseillersLeft, conseillersRight] = splitInHalf(detail.conseillers);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{detail.commune}</Text>
          {detail.maire ? (
            <Text style={styles.maire}>{detail.maire}</Text>
          ) : null}
        </View>

        <Text style={styles.compactRow}>{detail.adresse_mairie}</Text>
        {detail.telephones.length > 0 ? (
          <Text style={styles.compactRow}>{detail.telephones.join(" · ")}</Text>
        ) : null}
        {detail.emails.length > 0 ? (
          <Text style={styles.compactRow}>{detail.emails.join(" · ")}</Text>
        ) : null}
        <View style={styles.blankLine} />
        <HorairesPdfBlock lines={horairesLines} />

        <Text style={styles.sectionTitle}>
          Conseillers ({detail.conseillers.length})
        </Text>
        {detail.conseillers.length === 0 ? (
          <Text style={styles.row}>—</Text>
        ) : (
          <View style={styles.conseillersGrid}>
            {[conseillersLeft, conseillersRight].map((column, columnIndex) => (
              <View
                key={columnIndex === 0 ? "left" : "right"}
                style={styles.conseillersCol}
              >
                {column.map((person) => (
                  <Text
                    key={`${person.nom}-${person.prenom}`}
                    style={styles.conseillerRow}
                  >
                    {person.prenom} {person.nom}{" "}
                    <Text style={styles.role}>({person.fonction})</Text>
                  </Text>
                ))}
              </View>
            ))}
          </View>
        )}

        <Text style={styles.sectionTitle}>Suivi prospection</Text>
        {outreach.outcome ? (
          <Text style={styles.suiviRow}>
            <Text style={styles.label}>Résultat : </Text>
            {PROSPECT_OUTCOME_LABELS[outreach.outcome]}
          </Text>
        ) : null}
        <Text style={styles.suiviRow}>
          <Text style={styles.label}>Premier contact : </Text>
          {formatDate(outreach.first_contact_at)}
          {outreach.first_contact_type
            ? ` (${PROSPECT_FIRST_CONTACT_TYPE_LABELS[outreach.first_contact_type]})`
            : ""}
        </Text>
        <View style={styles.suiviSplitRow}>
          <Text style={styles.splitCol}>
            <Text style={styles.label}>Visite 1 : </Text>
            {formatDate(outreach.visit_1_at)}
          </Text>
          <Text style={styles.splitCol}>
            <Text style={styles.label}>Visite 2 : </Text>
            {formatDate(outreach.visit_2_at)}
          </Text>
        </View>
        <Text style={styles.suiviRow}>
          <Text style={styles.label}>Conseil municipal : </Text>
          {formatDate(outreach.council_demo_at)}
        </Text>
        <View style={styles.suiviSplitRow}>
          <Text style={styles.splitCol}>
            <Text style={styles.label}>Commerces / établissements : </Text>
            {outreach.commerce_count ?? "—"}
          </Text>
          <Text style={styles.splitCol}>
            <Text style={styles.label}>Associations : </Text>
            {outreach.association_count ?? "—"}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Notes</Text>
        <ProspectNotesPdf notesJson={outreach.notes_json} />
      </Page>
    </Document>
  );
}
