import { notFound } from "next/navigation";
import { LegalDocumentLogo } from "@/components/features/legal/legal-document-logo";
import { LegalDocumentPrintButton } from "@/components/features/legal/legal-document-print-button";
import { Card } from "@/components/ui/card";
import { PageStack } from "@/components/ui/page-stack";
import { legalDocumentProseClassName } from "@/lib/legal/editor-config";
import { isLegalDocumentSlug } from "@/lib/legal/seed-content";
import { getCachedLegalDocument } from "@/lib/queries/legal-documents";
import { cn } from "@/lib/utils/cn";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;

  if (!isLegalDocumentSlug(slug)) {
    return { title: "Document introuvable" };
  }

  const document = await getCachedLegalDocument(slug);

  return {
    title: document?.title ?? "Document juridique",
  };
}

export default async function LegalDocumentPage({ params }: Props) {
  const { slug } = await params;

  if (!isLegalDocumentSlug(slug)) {
    notFound();
  }

  const document = await getCachedLegalDocument(slug);

  if (!document) {
    notFound();
  }

  return (
    <PageStack className="mx-auto w-full max-w-3xl px-6 py-10 md:px-10 md:py-16">
      <div className="flex justify-end print:hidden">
        <LegalDocumentPrintButton />
      </div>

      <Card className="p-6 md:p-10 print:border-0 print:bg-transparent print:p-0 print:shadow-none">
        <LegalDocumentLogo />
        <article
          className={cn(legalDocumentProseClassName, "legal-document-print")}
          dangerouslySetInnerHTML={{ __html: document.content_html }}
        />
      </Card>

      <p className="text-center text-xs text-muted print:hidden">
        Vous pouvez enregistrer ce document au format PDF via le bouton
        « Imprimer / PDF » de votre navigateur.
      </p>
    </PageStack>
  );
}
