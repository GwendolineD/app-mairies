import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import {
  listMyConversations,
  type PaginatedConversations,
} from "@/lib/queries/messages";

/**
 * Request-scoped inbox loader (React `cache`).
 * The inbox layout and the inbox index page both need the first page of
 * conversations during the same request; this dedupes the RPC round-trip.
 * Server-only: imports the server Supabase client.
 */
export const getInboxConversations = cache(
  async (
    communeId: string,
    archived: boolean,
  ): Promise<PaginatedConversations> => {
    const supabase = await createClient();
    return listMyConversations(supabase, communeId, { archived });
  },
);
