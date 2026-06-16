import { createClient } from "@/lib/supabase/server";
import { applyCommuneSubscription } from "@/lib/actions/platform";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeading } from "@/components/ui/page-heading";
import type { SubscriptionStatus } from "@/lib/types";

export default async function PlatformCommunesPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("communes")
    .select("*")
    .order("name");

  const rows = data ?? [];

  return (
    <div className="space-y-4">
      <PageHeading title="Communes" />
      <div className="space-y-3">
        {rows.map((c) => (
          <Card key={c.id} className="space-y-3 p-4">
            <div className="flex flex-wrap justify-between gap-4">
              <div>
                <p className="text-xl font-semibold leading-7 text-text">{c.name}</p>
                <p className="text-xs font-medium text-muted">
                  INSEE {c.insee_code} · {c.subscription_status}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {(["inactive", "trial", "active"] as SubscriptionStatus[]).map((status) => (
                  <form key={`${c.id}-${status}`} action={applyCommuneSubscription}>
                    <input type="hidden" name="communeId" value={c.id} />
                    <input type="hidden" name="status" value={status} />
                    <Button
                      type="submit"
                      variant={c.subscription_status === status ? "primary" : "secondary"}
                      className="px-3 py-1 text-[10px]"
                    >
                      {status}
                    </Button>
                  </form>
                ))}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
