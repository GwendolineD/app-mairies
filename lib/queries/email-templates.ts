import type { SupabaseClient } from "@supabase/supabase-js";

export type EmailTemplateRow = {
  slug: string;
  subject: string;
  body_html: string;
  description: string | null;
  updated_at: string;
};

export async function listEmailTemplates(
  supabase: SupabaseClient,
): Promise<EmailTemplateRow[]> {
  const { data, error } = await supabase
    .from("email_templates")
    .select("slug, subject, body_html, description, updated_at")
    .order("slug");

  if (error) {
    console.error("[email-templates] List error:", error);
    return [];
  }

  return data ?? [];
}

export async function getEmailTemplate(
  supabase: SupabaseClient,
  slug: string,
): Promise<EmailTemplateRow | null> {
  const { data, error } = await supabase
    .from("email_templates")
    .select("slug, subject, body_html, description, updated_at")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.error("[email-templates] Get error:", error);
    return null;
  }

  return data;
}
