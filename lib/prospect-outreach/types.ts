export const PROSPECT_OUTREACH_STATUSES = [
  "not_contacted",
  "in_progress",
  "completed",
] as const;

export type ProspectOutreachStatus = (typeof PROSPECT_OUTREACH_STATUSES)[number];

export const PROSPECT_FIRST_CONTACT_TYPES = [
  "email",
  "sms",
  "call",
  "in_person",
] as const;

export type ProspectFirstContactType =
  (typeof PROSPECT_FIRST_CONTACT_TYPES)[number];

export const PROSPECT_OUTCOMES = [
  "abandon",
  "refusal",
  "adhesion",
  "reflection",
] as const;

export type ProspectOutcome = (typeof PROSPECT_OUTCOMES)[number];

export const PROSPECT_OUTREACH_STATUS_LABELS: Record<
  ProspectOutreachStatus,
  string
> = {
  not_contacted: "Non démarché",
  in_progress: "En cours",
  completed: "Terminé",
};

export const PROSPECT_FIRST_CONTACT_TYPE_LABELS: Record<
  ProspectFirstContactType,
  string
> = {
  email: "Email",
  sms: "SMS / texto",
  call: "Appel",
  in_person: "Face à face",
};

export const PROSPECT_OUTCOME_LABELS: Record<ProspectOutcome, string> = {
  abandon: "Abandon",
  refusal: "Refus",
  adhesion: "Adhésion",
  reflection: "En réflexion",
};

export type ProspectOutreach = {
  prospect_commune_id: string;
  status: ProspectOutreachStatus;
  outcome: ProspectOutcome | null;
  first_contact_at: string | null;
  first_contact_type: ProspectFirstContactType | null;
  visit_1_at: string | null;
  visit_2_at: string | null;
  council_demo_at: string | null;
  commerce_count: number | null;
  association_count: number | null;
  notes_json: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

/** Lightweight outreach fields for list / map embed. */
export type ProspectOutreachListEmbed = Pick<
  ProspectOutreach,
  | "status"
  | "outcome"
  | "visit_1_at"
  | "first_contact_at"
>;

export const PROSPECT_OUTREACH_LIST_EMBED_SELECT =
  "status, outcome, visit_1_at, first_contact_at" as const;

export const EMPTY_TIPTAP_DOC: Record<string, unknown> = {
  type: "doc",
  content: [],
};

export type ProspectOutreachUpdateInput = {
  status: ProspectOutreachStatus;
  outcome?: ProspectOutcome | null;
  first_contact_at?: string | null;
  first_contact_type?: ProspectFirstContactType | null;
  visit_1_at?: string | null;
  visit_2_at?: string | null;
  council_demo_at?: string | null;
  commerce_count?: number | null;
  association_count?: number | null;
  notes_json?: Record<string, unknown> | null;
};

export type ProspectCommuneReferenceUpdateInput = {
  maire?: string | null;
  adresse_mairie?: string;
  telephones?: string[];
  emails?: string[];
  horaires_ouverture?: string | null;
  conseillers?: Array<{
    nom: string;
    prenom: string;
    fonction: string;
  }>;
};

export function isProspectOutreachStatus(
  value: string,
): value is ProspectOutreachStatus {
  return (
    value === "not_contacted" ||
    value === "in_progress" ||
    value === "completed"
  );
}

export function isProspectOutcome(value: string): value is ProspectOutcome {
  return (
    value === "abandon" ||
    value === "refusal" ||
    value === "adhesion" ||
    value === "reflection"
  );
}
