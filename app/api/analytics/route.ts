import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
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

  const service = await createServiceClient();
  await service.from("analytics_events").insert({
    event_name: eventName,
    commune_id: communeId ?? null,
    user_id: user?.id ?? null,
    props: props ?? {},
  });

  return NextResponse.json({ ok: true });
}
