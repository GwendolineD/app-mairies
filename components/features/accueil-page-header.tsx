import { PageHeading } from "@/components/ui/page-heading";
import { InfoPopover } from "@/components/features/onboarding/info-popover";

export function AccueilPageHeader() {
  return (
    <PageHeading
      title="Accueil"
      subtitle="L'essentiel près de chez vous — pour tout voir, utilisez les onglets en bas."
      actions={<InfoPopover slide="accueil" />}
    />
  );
}
