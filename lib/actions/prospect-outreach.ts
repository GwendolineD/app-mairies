"use server";

import { revalidatePath } from "next/cache";
import { logAudit } from "@/lib/audit/log";
import { requirePlatformAdmin } from "@/lib/auth/session";
import { ROUTES } from "@/lib/constants/routes";
import {
  isUniqueViolation,
  resolveProspectPopulation,
} from "@/lib/prospect-communes/create-prospect-commune";
import { extractPostcode } from "@/lib/prospect-communes/extract-postcode";
import { fetchGeoCommuneByInsee } from "@/lib/prospect-communes/geo-commune";
import { resolveProspectCoordinates } from "@/lib/prospect-communes/resolve-coordinates";
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
import {
  createProspectCommuneSchema,
  prospectCommuneIdSchema,
} from "@/lib/validations/schemas";
import { createClient } from "@/lib/supabase/server";

const PROSPECTION_PATH = ROUTES.backoffice.prospectionCommunes;

export type LookupProspectCommuneResult = {
  existing: { id: string; commune: string; departement: string } | null;
};

export type CreateProspectCommuneResult =
  | { success: true; prospectCommuneId: string }
  | { success: false; error: string; existingProspectCommuneId?: string };

export type DeleteProspectCommuneResult =
  | { success: true }
  | { success: false; error: string };

async function findExistingProspectCommune(
  supabase: Awaited<ReturnType<typeof createClient>>,
  inseeCode: string,
  commune: string,
  departement: string,
): Promise<{ id: string; commune: string; departement: string } | null> {
  const { data: byInsee } = await supabase
    .from("prospect_communes")
    .select("id, commune, departement")
    .eq("insee_code", inseeCode)
    .maybeSingle();

  if (byInsee) return byInsee;

  const { data: byName } = await supabase
    .from("prospect_communes")
    .select("id, commune, departement")
    .eq("commune", commune)
    .eq("departement", departement)
    .maybeSingle();

  return byName ?? null;
}

export async function lookupProspectCommuneByInsee(
  inseeCode: string,
): Promise<LookupProspectCommuneResult> {
  await requirePlatformAdmin();
  const trimmed = inseeCode.trim();
  if (!trimmed) {
    return { existing: null };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("prospect_communes")
    .select("id, commune, departement")
    .eq("insee_code", trimmed)
    .maybeSingle();

  if (error) {
    return { existing: null };
  }

  return { existing: data };
}

export async function createProspectCommuneAction(
  formData: FormData,
): Promise<CreateProspectCommuneResult> {
  const { userId } = await requirePlatformAdmin();

  const parsed = createProspectCommuneSchema.safeParse({
    inseeCode: String(formData.get("inseeCode") ?? "").trim(),
    adresse_mairie: String(formData.get("adresse_mairie") ?? "").trim(),
    postcode: String(formData.get("postcode") ?? "").trim(),
    populationFallback: formData.get("populationFallback"),
  });

  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0]?.message ?? "Paramètres invalides.";
    return { success: false, error: firstIssue };
  }

  const data = parsed.data;
  const geo = await fetchGeoCommuneByInsee(data.inseeCode);
  if (!geo) {
    return { success: false, error: "Commune introuvable sur geo.api.gouv.fr." };
  }

  const populationResult = resolveProspectPopulation(
    geo.population,
    data.populationFallback,
  );
  if ("error" in populationResult) {
    return { success: false, error: populationResult.error };
  }

  const commune = geo.nom.trim();
  const departement = geo.codeDepartement.trim();
  const supabase = await createClient();

  const existing = await findExistingProspectCommune(
    supabase,
    geo.code,
    commune,
    departement,
  );
  if (existing) {
    return {
      success: false,
      error: "Cette commune existe déjà dans la prospection.",
      existingProspectCommuneId: existing.id,
    };
  }

  const centroidCoords = geo.centre?.coordinates;
  const centroid = centroidCoords
    ? { lat: centroidCoords[1], lng: centroidCoords[0] }
    : null;

  const coords = await resolveProspectCoordinates({
    adresse_mairie: data.adresse_mairie,
    insee_code: geo.code,
    centroid,
  });

  const postcode =
    data.postcode?.trim() ||
    extractPostcode(data.adresse_mairie) ||
    null;

  const { data: inserted, error } = await supabase
    .from("prospect_communes")
    .insert({
      commune,
      departement,
      population: populationResult.population,
      distance_km: null,
      maire: null,
      conseillers: [] as Json,
      nombre_elus: null,
      adresse_mairie: data.adresse_mairie,
      postcode,
      latitude: coords.latitude,
      longitude: coords.longitude,
      geocode_source: coords.geocode_source,
      telephones: [],
      emails: [],
      horaires_ouverture: null,
      opening_days: [],
      insee_code: geo.code,
      import_batch_id: null,
      updated_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) {
    if (isUniqueViolation(error)) {
      const duplicate = await findExistingProspectCommune(
        supabase,
        geo.code,
        commune,
        departement,
      );
      return {
        success: false,
        error: "Cette commune existe déjà dans la prospection.",
        existingProspectCommuneId: duplicate?.id,
      };
    }
    return { success: false, error: error.message };
  }

  void logAudit({
    userId,
    action: "prospect_commune.create",
    category: "admin",
    targetType: "prospect_commune",
    targetId: inserted.id,
  });

  revalidatePath(PROSPECTION_PATH);
  return { success: true, prospectCommuneId: inserted.id };
}

export async function deleteProspectCommuneAction(
  prospectCommuneId: string,
): Promise<DeleteProspectCommuneResult> {
  const { userId } = await requirePlatformAdmin();

  const parsed = prospectCommuneIdSchema.safeParse(prospectCommuneId.trim());
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0]?.message ?? "Identifiant invalide.";
    return { success: false, error: firstIssue };
  }

  const id = parsed.data;
  const supabase = await createClient();
  const detail = await getProspectCommuneById(supabase, id);
  if (!detail) {
    return { success: false, error: "Commune introuvable." };
  }

  const { data, error } = await supabase
    .from("prospect_communes")
    .delete()
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) {
    return { success: false, error: error.message };
  }

  if (!data) {
    return {
      success: false,
      error: "Commune introuvable ou suppression refusée.",
    };
  }

  void logAudit({
    userId,
    action: "prospect_commune.delete",
    category: "admin",
    severity: "critical",
    targetType: "prospect_commune",
    targetId: id,
    metadata: { commune: detail.commune },
  });

  revalidatePath(PROSPECTION_PATH);
  return { success: true };
}

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
