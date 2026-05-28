import Link from "next/link";
import { notFound } from "next/navigation";
import {
  submitArchiveInitiative,
  submitDeleteInitiative,
} from "@/lib/actions/initiatives";
import { requireActiveMembership } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { AssetPlaceholder } from "@/components/ui/asset-placeholder";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CategoryTag } from "@/components/ui/category-tag";
import { ReportButton } from "@/components/features/report-button";
import type { InitiativeRecord } from "@/lib/types";

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

  return (
    <div className="flex flex-col gap-5 px-4 py-6">
      <Link href="/initiatives" className="text-xs font-semibold text-purple underline">
        ← Toutes les initiatives
      </Link>

      <Card className="space-y-5 p-6">
        <div className="flex flex-wrap justify-between gap-3">
          <div>
            <CategoryTag label="Initiative" className="bg-mint/10 text-mint" />
            <h1 className="mt-2 text-[28px] font-bold leading-9 text-text">
              {initiative.title}
            </h1>
            <p className="text-sm font-medium text-muted">
              Statut communautaire : {initiative.status}
            </p>
          </div>
          <ReportButton contextType="initiative" contextId={initiative.id} />
        </div>

        <p className="whitespace-pre-line text-base font-medium leading-6 text-muted">
          {initiative.description}
        </p>

        <AssetPlaceholder
          description={`Temporalité « ${initiative.date_mode} » — calendrier collaboratif à venir`}
          className="rounded-3xl"
        />

        {isAuthor ? (
          <AuthorActions initiativeId={initiative.id} />
        ) : null}
      </Card>
    </div>
  );
}

function AuthorActions({ initiativeId }: { initiativeId: string }) {
  return (
    <div className="flex flex-wrap gap-2">
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
