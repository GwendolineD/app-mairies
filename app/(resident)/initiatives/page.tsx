import Link from "next/link";
import { requireActiveMembership } from "@/lib/auth/session";
import { ROUTES } from "@/lib/constants/routes";
import { INITIATIVE_STATUS } from "@/lib/constants/statuses";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ListGrid, PageStack } from "@/components/ui/page-stack";
import { PageHeading } from "@/components/ui/page-heading";
import type { InitiativeRecord } from "@/lib/types";

export default async function InitiativesListePage() {
  const ctx = await requireActiveMembership();
  const supabase = await createClient();
  const { data } = await supabase
    .from("initiatives")
    .select("*")
    .eq("commune_id", ctx.activeMembership!.commune_id)
    .eq("status", INITIATIVE_STATUS.active)
    .order("created_at", { ascending: false });

  const rows = (data ?? []) as InitiativeRecord[];

  return (
    <PageStack>
      <header className="flex items-start justify-between gap-4 md:items-center">
        <PageHeading
          title="Initiatives"
          subtitle="Coopération douce : vos idées vivent mieux lorsqu'elles invitent clairement à participer ou simplement soutenir."
        />
        <Button href={ROUTES.initiatives.new} className="shrink-0 px-4 py-2 text-xs whitespace-nowrap">
          Nouvelle
        </Button>
      </header>
      {rows.length === 0 ? (
        <Card className="p-5 text-center text-sm font-medium text-muted">
          Une première initiative pourrait faire un grand bien collectif !
        </Card>
      ) : (
        <ListGrid>
          {rows.map((init) => (
            <Link href={ROUTES.initiatives.detail(init.id)} key={init.id} className="h-full">
              <Card className="flex h-full flex-col space-y-2 p-4 transition hover:border-purple/35">
                <h3 className="text-xl font-semibold leading-7 text-text">{init.title}</h3>
                {init.description ? (
                  <p className="line-clamp-3 text-sm font-medium leading-5 text-muted">
                    {init.description}
                  </p>
                ) : (
                  <p className="text-sm font-medium italic text-subtle">
                    Invitation ouverte : voyez les détails.
                  </p>
                )}
                <span className="mt-auto text-[10px] font-semibold text-subtle">
                  Mode temporalité : {init.date_mode}
                </span>
              </Card>
            </Link>
          ))}
        </ListGrid>
      )}
    </PageStack>
  );
}
