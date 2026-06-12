import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { listEmailTemplates } from "@/lib/queries/email-templates";
import { formatShortDate } from "@/lib/utils/format-date";
import { Card } from "@/components/ui/card";
import { PageHeading } from "@/components/ui/page-heading";
import { PageStack } from "@/components/ui/page-stack";
import { ROUTES } from "@/lib/constants/routes";

export const dynamic = "force-dynamic";

export default async function BackofficeEmailsPage() {
  const supabase = await createClient();
  const templates = await listEmailTemplates(supabase);

  return (
    <PageStack>
      <PageHeading
        title="Templates email"
        subtitle="Gérez les templates d'emails envoyés par la plateforme."
      />

      {templates.length === 0 ? (
        <Card className="p-6 text-sm font-medium text-muted">
          Aucun template email configuré.
        </Card>
      ) : (
        <div className="space-y-2">
          {templates.map((template) => (
            <Link
              key={template.slug}
              href={`${ROUTES.backoffice.emails}/${template.slug}`}
              className="block"
            >
              <Card className="cursor-pointer p-4 transition hover:shadow-md">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-text">
                      {template.slug}
                    </p>
                    <p className="mt-1 truncate text-sm text-muted">
                      {template.description ?? "Pas de description"}
                    </p>
                  </div>
                  <div className="text-right text-xs text-muted">
                    <p>Modifié le</p>
                    <p className="font-medium text-text">
                      {formatShortDate(template.updated_at)}
                    </p>
                  </div>
                </div>
                <p className="mt-3 truncate text-xs text-subtle">
                  Sujet : {template.subject}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </PageStack>
  );
}
