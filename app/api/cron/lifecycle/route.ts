import { NextResponse, type NextRequest } from "next/server";

import { runLifecycleCollector } from "@/lib/cron/lifecycle-collector";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  const authorized = secret && authHeader === `Bearer ${secret}`;

  if (!secret || !authorized) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const service = await createServiceClient();
    const result = await runLifecycleCollector(service);

    return NextResponse.json({ ok: true, ...result, at: new Date().toISOString() });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[cron/lifecycle] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
