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

    // If any phases failed, include an error summary for cron-job.org alerting
    const hasFailures = result.failedPhases.length > 0;
    const response: Record<string, unknown> = {
      ok: !hasFailures,
      ...result,
      at: new Date().toISOString(),
    };
    if (hasFailures) {
      response.error = `${result.failedPhases.length} phase(s) failed: ${result.failedPhases.map((p) => p.phase).join(", ")}`;
    }

    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[cron/lifecycle] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
