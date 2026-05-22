import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * Periodic job — call with cron (e.g. daily) :
 * Bearer CRON_SECRET
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  const authorized = secret && authHeader === `Bearer ${secret}`;

  if (!secret || !authorized) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const service = await createServiceClient();

  const now = new Date();
  const yyyyMmDdLocal = toYmd(now);
  const inThreeDays = new Date(now.getTime());
  inThreeDays.setUTCDate(inThreeDays.getUTCDate() + 3);
  const yyyyMmDdPlus3 = toYmd(inThreeDays);

  /* Expired: target strictly before today */
  const expiredRes = await service
    .from("announcements")
    .update({
      status: "expiree",
      expired_notified_at: now.toISOString(),
    })
    .eq("status", "ouverte")
    .not("target_date", "is", null)
    .lt("target_date", yyyyMmDdLocal)
    .is("expired_notified_at", null)
    .select("id");

  if (expiredRes.error) {
    return NextResponse.json({ error: expiredRes.error.message }, { status: 500 });
  }

  /* Expiring soon: target within next 3 days (UTC), still open */
  const expiringSoonRes = await service
    .from("announcements")
    .update({ expiring_soon_sent_at: now.toISOString() })
    .eq("status", "ouverte")
    .not("target_date", "is", null)
    .gte("target_date", yyyyMmDdLocal)
    .lte("target_date", yyyyMmDdPlus3)
    .is("expiring_soon_sent_at", null)
    .select("id");

  if (expiringSoonRes.error) {
    return NextResponse.json(
      { error: expiringSoonRes.error.message },
      { status: 500 },
    );
  }

  const tenDaysMs = 10 * 24 * 60 * 60 * 1000;
  const staleBefore = new Date(now.getTime() - tenDaysMs).toISOString();

  /* Stale reminder (no claims / author follow-up UX hook) */
  const staleRes = await service
    .from("announcements")
    .update({ stale_nudge_sent_at: now.toISOString() })
    .eq("status", "ouverte")
    .lt("created_at", staleBefore)
    .is("stale_nudge_sent_at", null)
    .select("id");

  if (staleRes.error) {
    return NextResponse.json({ error: staleRes.error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    expired: expiredRes.data?.length ?? 0,
    expiringSoon: expiringSoonRes.data?.length ?? 0,
    stale: staleRes.data?.length ?? 0,
    at: now.toISOString(),
  });
}

function toYmd(d: Date) {
  return d.toISOString().slice(0, 10);
}
