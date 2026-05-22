import Link from "next/link";
import { requireActiveMembership } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
        <div>
          <h1 className="text-xl font-bold text-text">Initiatives</h1>
          <p className="text-xs leading-relaxed text-muted">
            Coopération douce&nbsp;: vos idées vivent mieux lorsqu&apos;elles invitent
            clairement à participer ou simplement soutenir.
          </p>
        </div>
        <Link href="/initiatives/nouvelle">
          <Button className="rounded-full px-4 py-2 text-xs whitespace-nowrap">
            Nouvelle
          </Button>
        </Link>
      </header>
      <section className="flex flex-col gap-3">
        {rows.map((init) => (
          <Link key={init.id} href={`/initiatives/${init.id}`}>
            <Card className="space-y-2 p-4 transition hover:border-purple/35">
              <h3 className="font-semibold text-text">{init.title}</h3>
              {init.description ? (
                <p className="line-clamp-2 text-xs leading-relaxed text-muted">
                  {init.description}
                </p>
              ) : (
                <p className="text-xs italic text-subtle">
                  Invitation ouverte&nbsp;: voyez les détails.
                </p>
              )}
              <span className="text-[10px] font-semibold text-subtle">
                Mode temporalité&nbsp;: {init.date_mode}
              </span>
            </Card>
          </Link>
        ))}
        {rows.length === 0 ? (
          <Card className="p-5 text-center text-sm text-muted">
            Une première initiative pourrait faire un grand bien collectif&nbsp;!
          </Card>
        ) : null}
      </section>
    </div>
  );
}
