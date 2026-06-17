import { requireActiveMembership } from "@/lib/auth/session";
import { ROUTES } from "@/lib/constants/routes";
import { listActiveInitiatives } from "@/lib/data/initiatives";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ListGrid, PageStack } from "@/components/ui/page-stack";
import { PageHeading } from "@/components/ui/page-heading";
import { InitiativeCard } from "@/components/features/initiatives/initiative-card";
import { InfoPopover } from "@/components/features/onboarding/info-popover";

export default async function InitiativesListePage() {
  const ctx = await requireActiveMembership();
  const initiatives = await listActiveInitiatives(ctx.activeMembership!.commune_id);

  return (
    <PageStack>
      <header className="flex flex-wrap items-start justify-between gap-3 md:items-center">
        <PageHeading
          title="Initiatives"
          subtitle="Les projets collectifs qui font vivre votre commune : rejoignez ou lancez un élan d'entraide."
          actions={<InfoPopover slide="initiatives" />}
        />
        <Button
          href={ROUTES.initiatives.new}
          className="shrink-0 px-4 py-2 text-xs whitespace-nowrap"
        >
          Nouvelle initiative
        </Button>
      </header>
      {initiatives.length === 0 ? (
        <Card className="p-5 text-center text-sm font-medium text-muted">
          Une première initiative pourrait faire un grand bien collectif !
        </Card>
      ) : (
        <ListGrid>
          {initiatives.map((initiative) => (
            <InitiativeCard key={initiative.id} initiative={initiative} />
          ))}
        </ListGrid>
      )}
    </PageStack>
  );
}
