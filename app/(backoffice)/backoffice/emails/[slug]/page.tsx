import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getEmailTemplate } from "@/lib/queries/email-templates";
import { EmailTemplateEditHeader } from "@/components/features/backoffice/email-template-edit-header";
import { EmailTemplateEditor } from "@/components/features/backoffice/email-template-editor";
import { HistoryBackLink } from "@/components/ui/history-back-link";
import { PageStack } from "@/components/ui/page-stack";

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
      <HistoryBackLink />
      <EmailTemplateEditHeader
        slug={template.slug}
        description={template.description}
      />
      <EmailTemplateEditor template={template} />
    </PageStack>
  );
}
