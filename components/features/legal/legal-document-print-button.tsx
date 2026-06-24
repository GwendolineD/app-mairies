"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LegalDocumentPrintButton() {
  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      className="print:hidden"
      onClick={() => window.print()}
    >
      <Printer className="size-4" aria-hidden />
      Imprimer / PDF
    </Button>
  );
}
