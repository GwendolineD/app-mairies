import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { listLegalDocuments } from "@/lib/queries/legal-documents";
import { Card } from "@/components/ui/card";
import { PageHeading } from "@/components/ui/page-heading";
import { PageStack } from "@/components/ui/page-stack";
import { ROUTES } from "@/lib/constants/routes";
import { formatShortDate } from "@/lib/utils/format-date";

export const dynamic = "force-dynamic";

export default async function BackofficeLegalPage() {
  const supabase = await createClient();
  const documents = await listLegalDocuments(supabase);

  return (
    <PageStack>
      <PageHeading
        title="Documents juridiques"
        subtitle="Modifiez les CGU et la politique de confidentialité affichées aux utilisateurs."
      />

      <div className="space-y-2">
        {documents.map((document) => (
          <Link
            key={document.slug}
            href={ROUTES.backoffice.legalDetail(document.slug)}
            className="block"
          >
            <Card className="cursor-pointer p-4 transition hover:shadow-md">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-text">
                    {document.title}
                  </p>
                  <p className="mt-1 truncate text-sm text-muted">
                    /legal/{document.slug}
                  </p>
                </div>
                <div className="text-right text-xs text-muted">
                  <p>Modifié le</p>
                  <p className="font-medium text-text">
                    {formatShortDate(document.updated_at)}
                  </p>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </PageStack>
  );
}
