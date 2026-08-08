/**
 * Recipient-selection guard for the commune fan-out.
 *
 * These cases lock the *who gets notified* contract, now asserting on the RPC
 * parameters and the bulk operations rather than per-user notifyUser calls.
 *
 * Sujet 4 rewrite: the fan-out now uses:
 * - An RPC `select_content_notification_recipients` for recipient selection
 * - Bulk insert into `notifications`
 * - Bulk fetch from `push_subscriptions` via sendPushToSubscriptions
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createServiceClient: vi.fn(),
}));

vi.mock("@/lib/services/push-notifications", () => ({
  sendPushToSubscriptions: vi.fn().mockResolvedValue({ sent: 0, failed: 0 }),
}));

const COMMUNE_ID = "27027000-0000-4000-8000-000000000001";
const AUTHOR_ID = "27027000-0000-4000-8000-000000000010";
const NEIGHBOUR_A = "27027000-0000-4000-8000-000000000011";
const NEIGHBOUR_B = "27027000-0000-4000-8000-000000000012";
const NEIGHBOUR_C = "27027000-0000-4000-8000-000000000013";
const CONTENT_ID = "27027000-0000-4000-8000-0000000000a1";

type RpcResult = { data: Array<{ user_id: string }> | null; error: { message: string } | null };
type InsertResult = { error: { message: string } | null };

function stubClient(options: {
  rpcResults: RpcResult[];
  insertError?: string | null;
}) {
  let rpcCallIndex = 0;
  const rpcCalls: Array<Record<string, unknown>> = [];
  const insertCalls: Array<unknown[]> = [];

  const rpc = vi.fn((name: string, args: Record<string, unknown>) => {
    rpcCalls.push({ name, ...args });
    const result = options.rpcResults[rpcCallIndex] ?? { data: [], error: null };
    rpcCallIndex++;
    return Promise.resolve(result);
  });

  const insertBuilder = {
    insert: vi.fn((rows: unknown[]) => {
      insertCalls.push(rows);
      return Promise.resolve({
        error: options.insertError ? { message: options.insertError } : null,
      } as InsertResult);
    }),
  };

  const from = vi.fn((table: string) => {
    if (table === "notifications") {
      return insertBuilder;
    }
    return insertBuilder;
  });

  return {
    client: { rpc, from },
    rpc,
    from,
    rpcCalls,
    insertCalls,
    insertBuilder,
  };
}

async function runFanout(
  client: unknown,
  overrides: { excludeUserIds?: string[]; contextType?: string } = {},
) {
  const { createServiceClient } = await import("@/lib/supabase/server");
  vi.mocked(createServiceClient).mockResolvedValue(client as never);

  const { fanoutNewContentNotification } = await import(
    "@/lib/services/notification-fanout"
  );

  return fanoutNewContentNotification({
    contextType: (overrides.contextType ?? "announcement") as "announcement" | "initiative" | "event",
    contextId: CONTENT_ID,
    communeId: COMMUNE_ID,
    authorUserId: AUTHOR_ID,
    title: "Besoin d'un coup de main au jardin",
    authorDisplayName: "Camille D.",
    excludeUserIds: overrides.excludeUserIds,
  });
}

describe("fanoutNewContentNotification — recipient selection via RPC", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("calls the RPC with correct parameters including commune, context type, and author", async () => {
    const { client, rpcCalls } = stubClient({
      rpcResults: [{ data: [{ user_id: NEIGHBOUR_A }], error: null }],
    });
    await runFanout(client);

    expect(rpcCalls.length).toBeGreaterThanOrEqual(1);
    const firstCall = rpcCalls[0];
    expect(firstCall.name).toBe("select_content_notification_recipients");
    expect(firstCall.p_commune_id).toBe(COMMUNE_ID);
    expect(firstCall.p_context_type).toBe("announcement");
    expect(firstCall.p_author_user_id).toBe(AUTHOR_ID);
    expect(firstCall.p_limit).toBe(150);
  });

  it("inserts notifications for every recipient returned by the RPC", async () => {
    const { client, insertCalls } = stubClient({
      rpcResults: [
        { data: [{ user_id: NEIGHBOUR_A }, { user_id: NEIGHBOUR_B }], error: null },
      ],
    });
    const result = await runFanout(client);

    expect(result.ok).toBe(true);
    expect(result.recipientsResolved).toBe(2);
    expect(insertCalls.length).toBe(1);
    expect(insertCalls[0]).toHaveLength(2);
    expect((insertCalls[0] as Array<{ user_id: string }>).map(r => r.user_id)).toEqual([
      NEIGHBOUR_A,
      NEIGHBOUR_B,
    ]);
  });

  it("passes excludeUserIds to the RPC", async () => {
    const { client, rpcCalls } = stubClient({
      rpcResults: [{ data: [{ user_id: NEIGHBOUR_B }], error: null }],
    });
    await runFanout(client, { excludeUserIds: [NEIGHBOUR_A] });

    expect(rpcCalls[0].p_exclude_user_ids).toEqual([NEIGHBOUR_A]);
  });

  it("returns early when RPC returns no recipients", async () => {
    const { client, insertCalls } = stubClient({
      rpcResults: [{ data: [], error: null }],
    });
    const result = await runFanout(client);

    expect(result.ok).toBe(true);
    expect(result.recipientsResolved).toBe(0);
    expect(insertCalls.length).toBe(0);
  });

  it("aborts and returns error when RPC fails", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { client, insertCalls } = stubClient({
      rpcResults: [{ data: null, error: { message: "Database connection failed" } }],
    });
    const result = await runFanout(client);

    expect(result.ok).toBe(false);
    expect(result.error).toBe("Database connection failed");
    expect(result.recipientsResolved).toBe(0);
    expect(insertCalls.length).toBe(0);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it("paginates through multiple pages when a page is full", async () => {
    // First page returns 150 users (full), second page returns fewer
    const page1Users = Array.from({ length: 150 }, (_, i) => ({
      user_id: `user-${String(i).padStart(4, "0")}`,
    }));
    const page2Users = [{ user_id: NEIGHBOUR_C }];

    const { client, rpcCalls, insertCalls } = stubClient({
      rpcResults: [
        { data: page1Users, error: null },
        { data: page2Users, error: null },
      ],
    });
    const result = await runFanout(client);

    expect(result.ok).toBe(true);
    expect(result.recipientsResolved).toBe(151);
    expect(rpcCalls.length).toBe(2);
    // Second call should have cursor set to last user of first page
    expect(rpcCalls[1].p_after_user_id).toBe("user-0149");
    expect(insertCalls.length).toBe(2);
  });

  it("calls sendPushToSubscriptions for each page of recipients", async () => {
    const { client } = stubClient({
      rpcResults: [
        { data: [{ user_id: NEIGHBOUR_A }, { user_id: NEIGHBOUR_B }], error: null },
      ],
    });
    await runFanout(client);

    const { sendPushToSubscriptions } = await import("@/lib/services/push-notifications");
    expect(sendPushToSubscriptions).toHaveBeenCalledTimes(1);
    expect(vi.mocked(sendPushToSubscriptions).mock.calls[0][1]).toEqual([
      NEIGHBOUR_A,
      NEIGHBOUR_B,
    ]);
  });

  it("handles different context types correctly", async () => {
    const { client, rpcCalls } = stubClient({
      rpcResults: [{ data: [{ user_id: NEIGHBOUR_A }], error: null }],
    });
    await runFanout(client, { contextType: "initiative" });

    expect(rpcCalls[0].p_context_type).toBe("initiative");
  });

  it("continues despite notification insert error but logs it", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { client } = stubClient({
      rpcResults: [{ data: [{ user_id: NEIGHBOUR_A }], error: null }],
      insertError: "Insert failed",
    });
    const result = await runFanout(client);

    // Fan-out should still complete (ok: true) but with 0 notifications inserted
    expect(result.ok).toBe(true);
    expect(result.recipientsResolved).toBe(1);
    expect(result.notificationsInserted).toBe(0);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it("logs summary at the end of fan-out", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const { client } = stubClient({
      rpcResults: [{ data: [{ user_id: NEIGHBOUR_A }], error: null }],
    });
    await runFanout(client);

    expect(log).toHaveBeenCalledWith(
      expect.stringContaining("[fanout]"),
    );
    expect(log).toHaveBeenCalledWith(
      expect.stringContaining("recipients=1"),
    );
    log.mockRestore();
  });
});
