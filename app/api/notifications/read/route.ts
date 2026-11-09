import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { notificationReadByTagSchema } from "@/lib/validations/schemas";

/**
 * Mark the in-app notification matching a push `tag` as read.
 * Called by the service worker when the user clicks a native push, so the
 * in-app feed and badge stay consistent with what was already seen.
 * Auth relies on the session cookie (same-origin fetch from the SW).
 */
export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const parsed = notificationReadByTagSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Idempotent: only unread rows are touched. Scoped to the caller's own rows
  // (RLS also enforces it); the tag is unique per user and content.
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .eq("tag", parsed.data.tag)
    .is("read_at", null);

  if (error) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
