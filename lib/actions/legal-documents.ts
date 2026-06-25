"use server";

import { revalidatePath, updateTag } from "next/cache";
import { requirePlatformAdmin } from "@/lib/auth/session";
import { ROUTES } from "@/lib/constants/routes";
import type { Json } from "@/lib/types/database.types";
import { LEGAL_DOCUMENTS_CACHE_TAG } from "@/lib/legal/cache-tags";
import {
  isLegalDocumentSlug,
  type LegalDocumentSlug,
} from "@/lib/legal/seed-content";
import { createClient } from "@/lib/supabase/server";
import { sanitizeHtml } from "@/lib/utils/sanitize-html";

type UpdateInput = {
  slug: LegalDocumentSlug;
  title: string;
  contentJson: Record<string, unknown>;
  contentHtml: string;
};

export async function updateLegalDocument(
  input: UpdateInput,
): Promise<{ success: boolean; error?: string }> {
  await requirePlatformAdmin();

  if (!isLegalDocumentSlug(input.slug)) {
    return { success: false, error: "Document introuvable." };
  }

  if (!input.title.trim()) {
    return { success: false, error: "Le titre est requis." };
  }

  const sanitizedHtml = sanitizeHtml(input.contentHtml);

  if (!sanitizedHtml.trim()) {
    return { success: false, error: "Le contenu ne peut pas être vide." };
  }

  const supabase = await createClient();

  const { data: existing, error: fetchError } = await supabase
    .from("legal_documents")
    .select("version")
    .eq("slug", input.slug)
    .maybeSingle();

  if (fetchError) {
    return { success: false, error: fetchError.message };
  }

  const nextVersion = (existing?.version ?? 0) + 1;
  const now = new Date().toISOString();

  const { error } = await supabase.from("legal_documents").upsert(
    {
      slug: input.slug,
      title: input.title.trim(),
      content_html: sanitizedHtml,
      content_json: input.contentJson as unknown as Json,
      version: nextVersion,
      published_at: now,
      updated_at: now,
    },
    { onConflict: "slug" },
  );

  if (error) {
    return { success: false, error: error.message };
  }

  updateTag(LEGAL_DOCUMENTS_CACHE_TAG);
  updateTag(`legal-document-${input.slug}`);
  revalidatePath(ROUTES.backoffice.legal);
  revalidatePath(`${ROUTES.backoffice.legal}/${input.slug}`);
  revalidatePath(ROUTES.legal.document(input.slug));

  return { success: true };
}
