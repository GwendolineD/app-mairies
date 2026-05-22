import type { AnalyticsEventName } from "./events";

type TrackProps = Record<string, string | number | boolean | null>;

/** Client-side analytics hook — inserts via API route (no PII). */
export async function track(
  eventName: AnalyticsEventName,
  props: TrackProps = {},
  communeId?: string | null,
) {
  try {
    await fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventName, props, communeId }),
    });
  } catch {
    // Analytics must not break UX
  }
}
