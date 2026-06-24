import { unstable_cache } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { LEGAL_DOCUMENTS_CACHE_TAG } from "@/lib/legal/cache-tags";
import {
  LEGAL_DOCUMENT_SEED,
  type LegalDocumentSlug,
} from "@/lib/legal/seed-content";
import type { LegalDocument } from "@/lib/types";

function createAnonClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

export async function listLegalDocuments(
  supabase: SupabaseClient,
): Promise<LegalDocument[]> {
  const { data, error } = await supabase
    .from("legal_documents")
    .select("*")
    .order("title");

  if (error) {
    throw new Error(error.message);
  }

  if (!data || data.length === 0) {
    return Object.entries(LEGAL_DOCUMENT_SEED).map(([slug, seed]) => ({
      slug,
      title: seed.title,
      content_html: seed.contentHtml,
      content_json: {},
      version: 1,
      published_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));
  }

  return data.map((row) => normalizeLegalDocument(row));
}

export async function getLegalDocument(
  supabase: SupabaseClient,
  slug: LegalDocumentSlug,
): Promise<LegalDocument | null> {
  const { data, error } = await supabase
    .from("legal_documents")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    const seed = LEGAL_DOCUMENT_SEED[slug];
    return {
      slug,
      title: seed.title,
      content_html: seed.contentHtml,
      content_json: {},
      version: 1,
      published_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  return normalizeLegalDocument(data);
}

export async function getCachedLegalDocument(
  slug: LegalDocumentSlug,
): Promise<LegalDocument | null> {
  return unstable_cache(
    async () => {
      const supabase = createAnonClient();
      return getLegalDocument(supabase, slug);
    },
    [`legal-document-${slug}`],
    {
      tags: [LEGAL_DOCUMENTS_CACHE_TAG, `legal-document-${slug}`],
      revalidate: 3600,
    },
  )();
}

function normalizeLegalDocument(row: {
  slug: string;
  title: string;
  content_html: string;
  content_json: unknown;
  version: number;
  published_at: string | null;
  updated_at: string;
}): LegalDocument {
  const seed = LEGAL_DOCUMENT_SEED[row.slug as LegalDocumentSlug];
  const contentHtml =
    row.content_html.trim().length > 0
      ? row.content_html
      : (seed?.contentHtml ?? "");

  return {
    slug: row.slug,
    title: row.title,
    content_html: contentHtml,
    content_json:
      row.content_json && typeof row.content_json === "object"
        ? (row.content_json as Record<string, unknown>)
        : {},
    version: row.version,
    published_at: row.published_at,
    updated_at: row.updated_at,
  };
}
