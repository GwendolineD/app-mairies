import Link from "next/link";
import { requireActiveMembership } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeading } from "@/components/ui/page-heading";
import type { InitiativeRecord } from "@/lib/types";

export default async function InitiativesListePage() {
  const ctx = await requireActiveMembership();
  const supabase = await createClient();
  const { data } = await supabase
    .from("initiatives")
    .select("*")
    .eq("commune_id", ctx.activeMembership!.commune_id)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  const rows = (data ?? []) as InitiativeRecord[];

  return (
    <div className="flex flex-col gap-6 px-4 py-6">
      <header className="flex items-start justify-between gap-4">
        <PageHeading
          title="Initiatives"
          subtitle="Coopération douce : vos idées vivent mieux lorsqu'elles invitent clairement à participer ou simplement soutenir."
        />
        <Button href="/initiatives/nouvelle" className="px-4 py-2 text-xs whitespace-nowrap">
          Nouvelle
        </Button>
      </header>
      <section className="flex flex-col gap-3">
        {rows.map((init) => (
          <Link key={init.id} href={`/initiatives/${init.id}`}>
            <Card className="space-y-2 p-4 transition hover:border-purple/35">
              <h3 className="text-xl font-semibold leading-7 text-text">{init.title}</h3>
              {init.description ? (
                <p className="line-clamp-2 text-sm font-medium leading-5 text-muted">
                  {init.description}
                </p>
              ) : (
                <p className="text-sm font-medium italic text-subtle">
                  Invitation ouverte : voyez les détails.
                </p>
              )}
              <span className="text-[10px] font-semibold text-subtle">
                Mode temporalité : {init.date_mode}
              </span>
            </Card>
          </Link>
        ))}
        {rows.length === 0 ? (
          <Card className="p-5 text-center text-sm font-medium text-muted">
            Une première initiative pourrait faire un grand bien collectif !
          </Card>
        ) : null}
      </section>
    </div>
  );
}
