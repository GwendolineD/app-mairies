import { requireRole } from "@/lib/auth/session";
import { ROUTES } from "@/lib/constants/routes";
import { USER_ROLES } from "@/lib/constants/roles";
import { MEMBERSHIP_STATUS } from "@/lib/constants/statuses";
import {
  reactivateMembership,
  suspendMembership,
} from "@/lib/actions/municipality";
import { createClient } from "@/lib/supabase/server";
import { formatDay } from "@/lib/utils/date";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CategoryTag } from "@/components/ui/category-tag";
import { PageHeading } from "@/components/ui/page-heading";
import { HabitantActions } from "@/components/features/mairie/habitant-actions";
import type { Membership, MembershipStatus, Profile } from "@/lib/types";

const PAGE_SIZE = 25;

const STATUS_FILTERS = [
  { key: "all", label: "Tou·tes" },
  { key: "active", label: "Actif·ves" },
  { key: "suspended", label: "Suspendu·es" },
] as const;

const STATUS_TAG: Record<MembershipStatus, string> = {
  active: "bg-mint/15 text-mint",
  suspended: "bg-coral/15 text-coral",
  left: "bg-warm text-muted",
};

const STATUS_LABEL: Record<MembershipStatus, string> = {
  active: "Actif·ve",
  suspended: "Suspendu·e",
  left: "Parti·e",
};

export default async function MairieHabitantsPage(props: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const ctx = await requireRole([USER_ROLES.municipalityStaff]);
  const communeId = ctx.profile.active_commune_id;
  if (!communeId)
    return (
      <p className="font-medium text-muted">Associez d&apos;abord une commune.</p>
    );

  const { status, page } = await props.searchParams;
  const statusFilter =
    status === "active" || status === "suspended" ? status : "all";
  const currentPage = Math.max(1, Number(page) || 1);
  const from = (currentPage - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const supabase = await createClient();

  let query = supabase
    .from("memberships")
    .select("*", { count: "exact" })
    .eq("commune_id", communeId)
    .neq("status", MEMBERSHIP_STATUS.left);

  if (statusFilter !== "all") {
    query = query.eq("status", statusFilter);
  }

  const { data, count } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  const memberships = (data ?? []) as Membership[];

  // memberships.user_id and profiles.user_id both reference auth.users, with no
  // direct FK between them, so resolve display names in a second bounded query.
  const userIds = memberships.map((m) => m.user_id);
  const profilesById = new Map<string, Profile>();
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, first_name, last_name, display_name")
      .in("user_id", userIds);
    for (const p of (profiles ?? []) as Profile[]) {
      profilesById.set(p.user_id, p);
    }
  }

  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function buildHref(params: { status?: string; page?: number }) {
    const sp = new URLSearchParams();
    const s = params.status ?? statusFilter;
    if (s && s !== "all") sp.set("status", s);
    const p = params.page ?? currentPage;
    if (p > 1) sp.set("page", String(p));
    const qs = sp.toString();
    return qs ? `${ROUTES.mairie.habitants}?${qs}` : ROUTES.mairie.habitants;
  }

  return (
    <div className="space-y-4">
      <Card className="space-y-4 p-6">
        <PageHeading
          title="Habitant·es inscrit·es"
          subtitle="Suivez les adhésions de votre commune, suspendez ou réactivez un compte en cas de besoin."
        />
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((f) => (
            <Button
              key={f.key}
              href={buildHref({ status: f.key, page: 1 })}
              variant={statusFilter === f.key ? "primary" : "secondary"}
              className="px-4 py-2 text-xs"
            >
              {f.label}
            </Button>
          ))}
        </div>
        <p className="text-xs font-medium text-muted">
          {total} adhésion{total > 1 ? "s" : ""} · page {currentPage} /{" "}
          {totalPages}
        </p>
      </Card>

      <div className="space-y-2">
        {memberships.length === 0 ? (
          <p className="text-sm font-medium text-muted">
            Aucune adhésion pour ce filtre.
          </p>
        ) : (
          memberships.map((m) => {
            const profile = profilesById.get(m.user_id);
            const name =
              profile?.display_name ||
              [profile?.first_name, profile?.last_name]
                .filter(Boolean)
                .join(" ") ||
              "Habitant·e";
            return (
              <Card
                key={m.id}
                className="flex flex-wrap items-start justify-between gap-3 p-4 text-sm"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-text">{name}</p>
                    <CategoryTag
                      label={STATUS_LABEL[m.status]}
                      className={STATUS_TAG[m.status]}
                    />
                    {m.is_primary ? (
                      <CategoryTag label="Principal" className="bg-soft-pink" />
                    ) : null}
                  </div>
                  <p className="text-xs font-medium text-muted">
                    {m.address_label ?? "Adresse non renseignée"}
                    {m.address_postcode ? ` · ${m.address_postcode}` : ""}
                  </p>
                  <p className="text-[10px] font-medium text-subtle">
                    Inscrit·e le {formatDay(m.created_at)}
                    {m.status === "suspended" && m.suspended_at
                      ? ` · suspendu·e le ${formatDay(m.suspended_at)}`
                      : ""}
                  </p>
                  {m.status === "suspended" && m.suspension_reason ? (
                    <p className="text-[10px] font-medium text-coral">
                      Motif : {m.suspension_reason}
                    </p>
                  ) : null}
                </div>
                <HabitantActions
                  membershipId={m.id}
                  status={m.status}
                  suspendAction={suspendMembership}
                  reactivateAction={reactivateMembership}
                />
              </Card>
            );
          })
        )}
      </div>

      {totalPages > 1 ? (
        <div className="flex items-center justify-between">
          <Button
            href={buildHref({ page: Math.max(1, currentPage - 1) })}
            variant="secondary"
            className={
              currentPage <= 1
                ? "pointer-events-none px-4 py-2 text-xs opacity-50"
                : "px-4 py-2 text-xs"
            }
          >
            ← Précédent
          </Button>
          <Button
            href={buildHref({ page: Math.min(totalPages, currentPage + 1) })}
            variant="secondary"
            className={
              currentPage >= totalPages
                ? "pointer-events-none px-4 py-2 text-xs opacity-50"
                : "px-4 py-2 text-xs"
            }
          >
            Suivant →
          </Button>
        </div>
      ) : null}
    </div>
  );
}
