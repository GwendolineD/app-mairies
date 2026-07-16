import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getEmailTemplate } from "@/lib/queries/email-templates";
import { EmailTemplateEditor } from "@/components/features/backoffice/email-template-editor";
import { HistoryBackLink } from "@/components/ui/history-back-link";
import { PageStack } from "@/components/ui/page-stack";
import { ROUTES } from "@/lib/constants/routes";

export const dynamic = "force-dynamic";

export default async function BackofficeEmailTemplateEditPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;
  const supabase = await createClient();
  const template = await getEmailTemplate(supabase, slug);

  if (!template) notFound();

  return (
    <PageStack>
      <HistoryBackLink fallbackHref={ROUTES.backoffice.emails} />
      <EmailTemplateEditor template={template} />
    </PageStack>
  );
}
