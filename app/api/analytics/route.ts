import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ANALYTICS_EVENTS, type AnalyticsEventName } from "@/lib/analytics/events";

export async function POST(request: Request) {
  const body = await request.json();
  const eventName = body.eventName as AnalyticsEventName;
  const { props, communeId } = body;

  if (!ANALYTICS_EVENTS.includes(eventName)) {
    return NextResponse.json({ error: "Invalid event" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await supabase.from("analytics_events").insert({
    event_name: eventName,
    commune_id: communeId ?? null,
    user_id: user.id,
    properties: props ?? {},
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }

  return NextResponse.json({ ok: true });
}
