import { createClient } from "@/lib/supabase/server";
import { INITIATIVE_STATUS } from "@/lib/constants/statuses";
import type {
  InitiativeAuthor,
  InitiativeParticipation,
  InitiativeRecord,
} from "@/lib/types";

export type InitiativeDetail = {
  initiative: InitiativeRecord;
  author: InitiativeAuthor | null;
  participation: InitiativeParticipation;
};

type InitiativeRowWithAuthor = InitiativeRecord & {
  author: { id: string; user_id: string } | null;
};

/** Commune-scoped list of active initiatives, newest first. */
export async function listActiveInitiatives(
  communeId: string,
): Promise<InitiativeRecord[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("initiatives")
    .select("*")
    .eq("commune_id", communeId)
    .eq("status", INITIATIVE_STATUS.active)
    .order("created_at", { ascending: false });

  return (data ?? []) as InitiativeRecord[];
}

/**
 * Resolve a single initiative for the detail view: the record, its author
 * identity, and the viewer's participation snapshot. Returns `null` when the
 * initiative is absent or outside the viewer's commune.
 */
export async function getInitiativeDetail(
  communeId: string,
  initiativeId: string,
  viewerMembershipId: string,
): Promise<InitiativeDetail | null> {
  const supabase = await createClient();

  const { data: row } = await supabase
    .from("initiatives")
    .select("*, author:memberships!author_membership_id(id, user_id)")
    .eq("id", initiativeId)
    .eq("commune_id", communeId)
    .single();

  if (!row) return null;

  const { author: authorRel, ...rest } = row as InitiativeRowWithAuthor;
  const initiative = rest as InitiativeRecord;

  const [authorProfile, countResult, myResponse] = await Promise.all([
    authorRel?.user_id
      ? supabase
          .from("profiles")
          .select("display_name, avatar_url")
          .eq("user_id", authorRel.user_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("initiative_responses")
      .select("id", { count: "exact", head: true })
      .eq("initiative_id", initiativeId)
      .eq("response_type", "volunteer"),
    supabase
      .from("initiative_responses")
      .select("id")
      .eq("initiative_id", initiativeId)
      .eq("membership_id", viewerMembershipId)
      .eq("response_type", "volunteer")
      .maybeSingle(),
  ]);

  const author: InitiativeAuthor | null = authorRel
    ? {
        membershipId: authorRel.id,
        displayName: authorProfile.data?.display_name ?? null,
        avatarUrl: authorProfile.data?.avatar_url ?? null,
      }
    : null;

  const participation: InitiativeParticipation = {
    count: countResult.count ?? 0,
    isParticipating: Boolean(myResponse.data),
  };

  return { initiative, author, participation };
}
