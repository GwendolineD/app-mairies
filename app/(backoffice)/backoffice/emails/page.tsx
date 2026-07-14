import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { listEmailTemplates } from "@/lib/queries/email-templates";
import { formatShortDate } from "@/lib/datetime";
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
        <div className="@container space-y-2 md:grid md:grid-cols-3 md:gap-3 md:space-y-0 @lg:grid-cols-4">
          {templates.map((template) => (
            <Link
              key={template.slug}
              href={`${ROUTES.backoffice.emails}/${template.slug}`}
              className="block md:h-full"
            >
              <Card className="flex h-full flex-col cursor-pointer rounded-xl p-4 transition hover:shadow-md">
                <div className="flex min-h-0 flex-1 flex-col">
                  <div className="flex items-start justify-between gap-3 md:block md:flex-1">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs text-muted">
                        {template.slug}
                      </p>
                      <p
                        className="mt-1 line-clamp-3 text-xs font-semibold text-text"
                        title={template.description ?? undefined}
                      >
                        {template.description ?? "Pas de description"}
                      </p>
                    </div>
                    <div className="shrink-0 text-right text-xs text-muted md:hidden">
                      <p>Modifié le</p>
                      <p className="font-medium text-text">
                        {formatShortDate(template.updated_at)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 hidden shrink-0 text-right text-[10px] leading-3 text-subtle md:mt-auto md:block md:pt-3">
                    <p>Modifié le</p>
                    <p className="font-medium text-muted">
                      {formatShortDate(template.updated_at)}
                    </p>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </PageStack>
  );
}
