import Link from "next/link";
import { notFound } from "next/navigation";
import {
  submitArchiveInitiative,
  submitDeleteInitiative,
} from "@/lib/actions/initiatives";
import { requireActiveMembership } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
      <Link href="/initiatives" className="text-xs font-semibold text-purple">
        ← Toutes les initiatives
      </Link>

      <Card className="space-y-5 p-6">
        <div className="flex flex-wrap justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase text-muted">Initiative locale</p>
            <h1 className="text-2xl font-bold">{initiative.title}</h1>
            <p className="text-xs text-muted">Statut communautaire : {initiative.status}</p>
          </div>
          <ReportButton contextType="initiative" contextId={initiative.id} />
        </div>

        <p className="whitespace-pre-line text-sm text-muted">{initiative.description}</p>

        <div className="rounded-3xl bg-warm px-4 py-3 text-xs">
          Temporalité décrite comme «&nbsp;<strong>{initiative.date_mode}</strong>&nbsp;» –
          précisez le calendrier réel depuis les messages directs lorsque la messagerie
          collaborative sera disponible.
        </div>

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
        <Button type="submit" variant="secondary" className="rounded-full text-xs">
          Archiver
        </Button>
      </form>
      <form action={submitDeleteInitiative}>
        <input type="hidden" name="id" value={initiativeId} />
        <Button type="submit" variant="danger" className="rounded-full text-xs">
          Supprimer
        </Button>
      </form>
    </div>
  );
}
