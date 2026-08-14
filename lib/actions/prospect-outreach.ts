"use server";

import { revalidatePath } from "next/cache";
import { logAudit } from "@/lib/audit/log";
import { requirePlatformAdmin } from "@/lib/auth/session";
import { ROUTES } from "@/lib/constants/routes";
import {
  sanitizeProspectNotesJson,
} from "@/lib/prospect-outreach/notes-editor-config";
import { applyProspectOutreachStatusRules } from "@/lib/prospect-outreach/status-rules";
import type {
  ProspectCommuneReferenceUpdateInput,
  ProspectOutreachUpdateInput,
} from "@/lib/prospect-outreach/types";
import {
  ensureProspectOutreachRow,
  getProspectCommuneById,
} from "@/lib/queries/backoffice-prospect-communes";
import type { Json } from "@/lib/types/database.types";
import { createClient } from "@/lib/supabase/server";

const PROSPECTION_PATH = ROUTES.backoffice.prospectionCommunes;

export async function updateProspectOutreach(
  prospectCommuneId: string,
  input: ProspectOutreachUpdateInput,
): Promise<{ success: boolean; error?: string }> {
  await requirePlatformAdmin();
  const supabase = await createClient();

  await ensureProspectOutreachRow(supabase, prospectCommuneId);

  const detail = await getProspectCommuneById(supabase, prospectCommuneId);
  if (!detail) {
    return { success: false, error: "Commune introuvable." };
  }

  const { data: rules, errors } = applyProspectOutreachStatusRules(
    input,
    detail.outreach,
  );
  if (errors.length > 0) {
    return { success: false, error: errors[0]?.message };
  }

  const notesJson =
    input.notes_json === undefined
      ? detail.outreach.notes_json
      : sanitizeProspectNotesJson(input.notes_json);

  const payload = {
    status: rules.status,
    outcome: rules.outcome,
    first_contact_at:
      input.first_contact_at === undefined
        ? detail.outreach.first_contact_at
        : input.first_contact_at,
    first_contact_type:
      input.first_contact_type === undefined
        ? detail.outreach.first_contact_type
        : input.first_contact_type,
    visit_1_at:
      input.visit_1_at === undefined ? detail.outreach.visit_1_at : input.visit_1_at,
    visit_2_at:
      input.visit_2_at === undefined ? detail.outreach.visit_2_at : input.visit_2_at,
    council_demo_at:
      input.council_demo_at === undefined
        ? detail.outreach.council_demo_at
        : input.council_demo_at,
    commerce_count:
      input.commerce_count === undefined
        ? detail.outreach.commerce_count
        : input.commerce_count,
    association_count:
      input.association_count === undefined
        ? detail.outreach.association_count
        : input.association_count,
    notes_json: notesJson as Json,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("prospect_outreach")
    .update(payload)
    .eq("prospect_commune_id", prospectCommuneId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(PROSPECTION_PATH);
  return { success: true };
}

export async function updateProspectCommuneReference(
  prospectCommuneId: string,
  input: ProspectCommuneReferenceUpdateInput,
): Promise<{ success: boolean; error?: string }> {
  const { userId } = await requirePlatformAdmin();
  const supabase = await createClient();

  const detail = await getProspectCommuneById(supabase, prospectCommuneId);
  if (!detail) {
    return { success: false, error: "Commune introuvable." };
  }

  const { error } = await supabase
    .from("prospect_communes")
    .update({
      maire: input.maire === undefined ? detail.maire : input.maire,
      adresse_mairie:
        input.adresse_mairie === undefined
          ? detail.adresse_mairie
          : input.adresse_mairie.trim(),
      telephones: input.telephones ?? detail.telephones,
      emails: input.emails ?? detail.emails,
      horaires_ouverture:
        input.horaires_ouverture === undefined
          ? detail.horaires_ouverture
          : input.horaires_ouverture,
      conseillers: (input.conseillers ?? detail.conseillers) as Json,
      updated_at: new Date().toISOString(),
    })
    .eq("id", prospectCommuneId);

  if (error) {
    return { success: false, error: error.message };
  }

  void logAudit({
    userId,
    action: "prospect_commune.reference_update",
    category: "admin",
    targetType: "prospect_commune",
    targetId: prospectCommuneId,
  });

  revalidatePath(PROSPECTION_PATH);
  return { success: true };
}
