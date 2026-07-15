import { APP_NAME } from "@/lib/constants/app";
import {
  formatEmailHtmlVariable,
  formatEmailSubjectVariable,
} from "@/lib/email/format-variable";
import { createServiceClient } from "@/lib/supabase/server";
import { profileSettingsUrl } from "@/lib/utils/app-url";

export type TemplateVariables = Record<string, string | number | undefined>;

export type RenderedTemplate = {
  subject: string;
  html: string;
};

const GLOBAL_VARIABLES: TemplateVariables = {
  app_name: APP_NAME,
};

function getGlobalVariables(): TemplateVariables {
  return {
    ...GLOBAL_VARIABLES,
    logo_url: process.env.APP_LOGO_URL ?? "",
    settings_url: profileSettingsUrl(),
  };
}

function replaceVariables(
  template: string,
  variables: TemplateVariables,
  format: (value: string | number | undefined) => string,
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    const value = variables[key];
    if (value === undefined) return match;
    return format(value);
  });
}

export async function renderTemplate(
  slug: string,
  variables: TemplateVariables = {},
): Promise<RenderedTemplate | null> {
  const supabase = await createServiceClient();

  const { data: template, error } = await supabase
    .from("email_templates")
    .select("subject, body_html")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.error(
      `[email] Template "${slug}" query error:`,
      error.message,
      "| code:", error.code,
      "| hint:", error.hint,
      "| SUPABASE_SERVICE_ROLE_KEY set:", !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      "| NEXT_PUBLIC_SUPABASE_URL:", process.env.NEXT_PUBLIC_SUPABASE_URL,
    );
    return null;
  }

  if (!template) {
    console.error(
      `[email] Template "${slug}" returned null (no matching row).`,
      "| SUPABASE_SERVICE_ROLE_KEY set:", !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      "| NEXT_PUBLIC_SUPABASE_URL:", process.env.NEXT_PUBLIC_SUPABASE_URL,
    );
    return null;
  }

  // Globals last so static URLs (settings, logo) stay correct even if queue snapshots are stale.
  const allVariables: TemplateVariables = {
    ...variables,
    ...getGlobalVariables(),
  };

  return {
    subject: replaceVariables(template.subject, allVariables, formatEmailSubjectVariable),
    html: replaceVariables(template.body_html, allVariables, formatEmailHtmlVariable),
  };
}

export async function sendTemplatedEmail(
  to: string | string[],
  slug: string,
  variables: TemplateVariables = {},
): Promise<{ success: boolean; error?: string }> {
  const rendered = await renderTemplate(slug, variables);

  if (!rendered) {
    return { success: false, error: `Template "${slug}" not found` };
  }

  const { sendEmail } = await import("./send-email");
  return sendEmail({
    to,
    subject: rendered.subject,
    html: rendered.html,
  });
}
