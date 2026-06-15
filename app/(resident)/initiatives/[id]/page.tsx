import { notFound } from "next/navigation";
import {
  submitArchiveInitiative,
  submitDeleteInitiative,
} from "@/lib/actions/initiatives";
import { requireActiveMembership } from "@/lib/auth/session";
import { formatStreetDisplay } from "@/lib/ban/display";
import { getInitiativeCategoryLabel } from "@/lib/constants/initiative-categories";
import { ROUTES } from "@/lib/constants/routes";
import { createClient } from "@/lib/supabase/server";
import { BackLink } from "@/components/ui/back-link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ContentTypeTag } from "@/components/ui/content-type-tag";
import { InitiativeDetailTabs } from "@/components/features/initiative-detail-tabs";
import { ReportButton } from "@/components/features/report-button";
import type { InitiativeRecord } from "@/lib/types";
import { PageStack } from "@/components/ui/page-stack";
import { CarteAnnoncesMap } from "@/components/features/carte-preview-map";

export default async function InitiativeDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const ctx = await requireActiveMembership();
  const supabase = await createClient();

  const { data } = await supabase
    .from("initiatives")
    .select("*")
    .eq("commune_id", ctx.activeMembership!.commune_id)
    .eq("id", id)
    .single();

  if (!data) notFound();

  const initiative = data as InitiativeRecord;
  const isAuthor = initiative.author_membership_id === ctx.activeMembership?.id;

  const { count: participantCount } = await supabase
    .from("initiative_responses")
    .select("id", { count: "exact", head: true })
    .eq("initiative_id", id);

  const addressDisplay = initiative.address_label
    ? formatStreetDisplay(initiative.address_label)
    : (ctx.activeMembership?.address_street ??
      ctx.activeMembership?.address_city ??
      "Adresse non renseignée");

  return (
    <PageStack gap="5">
      <BackLink href={ROUTES.initiatives.list}>← Toutes les initiatives</BackLink>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="space-y-4 p-6 lg:col-span-2">
          <div className="flex flex-wrap justify-between gap-3">
            <div>
              <ContentTypeTag type="initiative" />
              {initiative.category_slug ? (
                <p className="mt-2 text-xs font-semibold text-mint">
                  {getInitiativeCategoryLabel(initiative.category_slug)}
                </p>
              ) : null}
              <h1 className="mt-2 text-[28px] font-bold leading-9 text-text">
                {initiative.title}
              </h1>
              <p className="text-sm text-muted">{addressDisplay}</p>
            </div>
            <ReportButton contextType="initiative" contextId={initiative.id} />
          </div>

          <InitiativeDetailTabs
            initiativeId={initiative.id}
            description={initiative.description}
            dateMode={initiative.date_mode}
            startsAt={initiative.single_starts_at}
            endsAt={initiative.single_ends_at}
            addressLabel={initiative.address_label}
            participantCount={participantCount ?? 0}
          />

          {isAuthor ? <AuthorActions initiativeId={initiative.id} /> : null}
        </Card>

        <aside>
          {initiative.address_lat != null && initiative.address_lng != null ? (
            <Card className="p-4">
              <h2 className="mb-2 text-lg font-semibold text-text">Où ?</h2>
              <CarteAnnoncesMap
                latitude={initiative.address_lat}
                longitude={initiative.address_lng}
                communeName={initiative.title}
                className="h-48 rounded-2xl overflow-hidden border border-border/70"
              />
            </Card>
          ) : null}
        </aside>
      </div>
    </PageStack>
  );
}

function AuthorActions({ initiativeId }: { initiativeId: string }) {
  return (
    <div className="flex flex-wrap gap-2 border-t border-border pt-4">
      <form action={submitArchiveInitiative}>
        <input type="hidden" name="id" value={initiativeId} />
        <Button type="submit" variant="secondary" className="text-xs">
          Archiver
        </Button>
      </form>
      <form action={submitDeleteInitiative}>
        <input type="hidden" name="id" value={initiativeId} />
        <Button type="submit" variant="danger" className="text-xs">
          Supprimer
        </Button>
      </form>
    </div>
  );
}
