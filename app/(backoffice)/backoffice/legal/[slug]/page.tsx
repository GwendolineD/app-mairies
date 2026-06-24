import Link from "next/link";
import { notFound } from "next/navigation";
import { LegalDocumentEditor } from "@/components/features/backoffice/legal-document-editor";
import { LegalDocumentLogo } from "@/components/features/legal/legal-document-logo";
import { Card } from "@/components/ui/card";
import { PageHeading } from "@/components/ui/page-heading";
import { PageStack } from "@/components/ui/page-stack";
import { requirePlatformAdmin } from "@/lib/auth/session";
import { ROUTES } from "@/lib/constants/routes";
import {
  isLegalDocumentSlug,
  type LegalDocumentSlug,
} from "@/lib/legal/seed-content";
import { getLegalDocument } from "@/lib/queries/legal-documents";
import { createClient } from "@/lib/supabase/server";
import { formatShortDate } from "@/lib/utils/format-date";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function BackofficeLegalDocumentPage({ params }: Props) {
  await requirePlatformAdmin();
  const { slug } = await params;

  if (!isLegalDocumentSlug(slug)) {
    notFound();
  }

  const supabase = await createClient();
  const document = await getLegalDocument(supabase, slug as LegalDocumentSlug);

  if (!document) {
    notFound();
  }

  return (
    <PageStack>
      <div className="space-y-2">
        <Link
          href={ROUTES.backoffice.legal}
          className="inline-flex cursor-pointer text-sm font-semibold text-purple transition hover:text-purple/80"
        >
          ← Documents juridiques
        </Link>
        <PageHeading
          title={document.title}
          subtitle={
            document.updated_at
              ? `Dernière modification le ${formatShortDate(document.updated_at)} — version ${document.version}`
              : undefined
          }
        />
      </div>

      <Card className="space-y-6 p-6">
        <div className="rounded-lg border border-border/60 bg-warm/40 p-4">
          <p className="mb-4 text-center text-xs font-semibold uppercase tracking-wide text-subtle">
            En-tête affiché sur la page publique
          </p>
          <LegalDocumentLogo className="pb-0" />
        </div>
        <LegalDocumentEditor document={document} />
      </Card>
    </PageStack>
  );
}
