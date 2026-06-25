import type { SupabaseClient } from "@supabase/supabase-js";
import type { CommunicationAsset } from "@/lib/types";

function normalizeCommunicationAsset(row: {
  id: string;
  commune_id: string | null;
  title: string;
  description: string | null;
  preview_url: string;
  file_url: string;
  sort_order: number;
  published: boolean;
  created_at: string;
  updated_at: string;
  commune?: { id: string; name: string } | { id: string; name: string }[] | null;
}): CommunicationAsset {
  const commune = Array.isArray(row.commune)
    ? (row.commune[0] ?? null)
    : (row.commune ?? null);

  return {
    id: row.id,
    commune_id: row.commune_id,
    title: row.title,
    description: row.description,
    preview_url: row.preview_url,
    file_url: row.file_url,
    sort_order: row.sort_order,
    published: row.published,
    created_at: row.created_at,
    updated_at: row.updated_at,
    commune,
  };
}

export async function listCommunicationAssets(
  supabase: SupabaseClient,
  communeId: string,
): Promise<CommunicationAsset[]> {
  const { data, error } = await supabase
    .from("communication_assets")
    .select("*")
    .eq("published", true)
    .or(`commune_id.is.null,commune_id.eq.${communeId}`)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => normalizeCommunicationAsset(row));
}

export async function listAllCommunicationAssets(
  supabase: SupabaseClient,
): Promise<CommunicationAsset[]> {
  const { data, error } = await supabase
    .from("communication_assets")
    .select("*, commune:communes(id, name)")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => normalizeCommunicationAsset(row));
}

export async function listCommunesForCommunicationForm(
  supabase: SupabaseClient,
): Promise<Array<{ id: string; name: string }>> {
  const { data, error } = await supabase
    .from("communes")
    .select("id, name")
    .order("name");

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}
