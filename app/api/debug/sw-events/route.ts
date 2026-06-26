import { NextResponse, type NextRequest } from "next/server";

export const dynamic = "force-dynamic";

/**
 * TEMPORARY diagnostic sink for service-worker push events.
 * The service worker POSTs what happens when a push is received
 * (data present? payload parsed? showNotification succeeded/failed?).
 * Stored in an in-memory ring buffer and read back via GET.
 * Remove once the push display issue is resolved.
 */
type SwEvent = Record<string, unknown> & { received_at?: number };

const store = globalThis as unknown as { __swEvents?: SwEvent[] };
store.__swEvents = store.__swEvents ?? [];

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Record<string, unknown>;
    store.__swEvents!.push({ ...body, received_at: Date.now() });
    const max = 50;
    if (store.__swEvents!.length > max) {
      store.__swEvents!.splice(0, store.__swEvents!.length - max);
    }
  } catch {
    // ignore malformed payloads
  }
  return NextResponse.json({ ok: true });
}

export async function GET() {
  return NextResponse.json({
    count: store.__swEvents!.length,
    events: [...store.__swEvents!].reverse(),
  });
}
