import React from "react";
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import { NextRequest, NextResponse } from "next/server";
import { requirePlatformAdminApi } from "@/lib/auth/require-platform-admin-api";
import { ProspectFichePdfDocument } from "@/lib/prospect-outreach/prospect-fiche-pdf";
import { getProspectCommuneById } from "@/lib/queries/backoffice-prospect-communes";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

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

  const buffer = await renderToBuffer(
    (<ProspectFichePdfDocument detail={detail} />) as React.ReactElement<DocumentProps>,
  );

  const filename = `prospection-${detail.commune.replace(/\s+/g, "-").toLowerCase()}.pdf`;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
