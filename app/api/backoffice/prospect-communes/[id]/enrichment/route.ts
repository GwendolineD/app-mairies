import { NextRequest, NextResponse } from "next/server";
import { requirePlatformAdminApi } from "@/lib/auth/require-platform-admin-api";
import { fetchProspectAssociationEnrichment } from "@/lib/services/prospect-association-enrichment";
import { getProspectCommuneById } from "@/lib/queries/backoffice-prospect-communes";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requirePlatformAdminApi();
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  const supabase = await createClient();
  const detail = await getProspectCommuneById(supabase, id);

  if (!detail) {
    return NextResponse.json({ error: "Commune introuvable." }, { status: 404 });
  }

  if (!detail.insee_code?.trim()) {
    return NextResponse.json(
      {
        error:
          "Code INSEE indisponible pour cette commune — géocodage ou import requis.",
      },
      { status: 400 },
    );
  }

  const result = await fetchProspectAssociationEnrichment(detail.insee_code);

  return NextResponse.json(result, {
    headers: { "Cache-Control": "no-store" },
  });
}
