import type {
  ProspectOutreach,
  ProspectOutreachStatus,
  ProspectOutreachUpdateInput,
  ProspectOutcome,
} from "@/lib/prospect-outreach/types";

export type StatusRulesError = {
  field: string;
  message: string;
};

export type AppliedOutreachState = Pick<
  ProspectOutreach,
  "status" | "outcome"
> & {
  first_contact_at: string | null;
};

export function applyProspectOutreachStatusRules(
  input: ProspectOutreachUpdateInput,
  previous: Pick<
    ProspectOutreach,
    "status" | "outcome" | "first_contact_at"
  > | null,
): { data: AppliedOutreachState; errors: StatusRulesError[] } {
  const errors: StatusRulesError[] = [];
  let status: ProspectOutreachStatus = input.status;
  let outcome: ProspectOutcome | null =
    input.outcome === undefined ? (previous?.outcome ?? null) : input.outcome;
  const firstContactAt =
    input.first_contact_at === undefined
      ? (previous?.first_contact_at ?? null)
      : input.first_contact_at;

  if (status === "completed") {
    if (!outcome) {
      errors.push({
        field: "outcome",
        message: "Le résultat est obligatoire pour une prospection terminée.",
      });
    }
  } else {
    outcome = null;
  }

  const hadContactBefore = Boolean(previous?.first_contact_at);
  const hasContactNow = Boolean(firstContactAt);

  if (status === "not_contacted" && hasContactNow && !hadContactBefore) {
    status = "in_progress";
  }

  if (errors.length > 0) {
    return {
      data: { status, outcome, first_contact_at: firstContactAt },
      errors,
    };
  }

  return {
    data: { status, outcome, first_contact_at: firstContactAt },
    errors: [],
  };
}
