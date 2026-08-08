/**
 * Lifecycle collector tests for sujet 3.
 *
 * These tests validate that:
 * - The RPC calls receive correct parameters and no content table reads occur
 * - Errors from RPC/insert/mark are properly propagated
 * - Email opt-out users still get push notifications but no queue entry
 * - Phase failures don't block subsequent phases
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/services/user-emails", () => ({
  getEmailsByUserIds: vi.fn(),
}));

vi.mock("@/lib/services/push-notifications", () => ({
  notifyUser: vi.fn(),
}));

vi.mock("@/lib/email/unsubscribe-token", () => ({
  generateUnsubscribeToken: vi.fn(() => "mock-unsubscribe-token"),
}));

const USER_ID_1 = "27027000-0000-4000-8000-000000000001";
const COMMUNE_ID = "27027000-0000-4000-8000-00000000c001";

type Candidate = {
  user_id: string;
  display_name: string;
  active_commune_id: string | null;
};

type Thenable<T> = {
  then: (onFulfilled: (value: T) => unknown) => Promise<unknown>;
};

function stubChain<T>(result: T): Record<string, unknown> & Thenable<T> {
  const builder: Record<string, unknown> = {
    then: (onFulfilled: (value: T) => unknown) =>
      Promise.resolve(result).then(onFulfilled),
  };
  for (const method of ["select", "eq", "in", "is", "lt", "gt", "not", "order", "limit", "delete", "update", "insert", "maybeSingle"]) {
    builder[method] = vi.fn(() => builder);
  }
  return builder as Record<string, unknown> & Thenable<T>;
}

type RpcCall = { fn: string; args: Record<string, unknown> };
type InsertCall = { table: string; rows: unknown[] };
type UpdateCall = { table: string; payload: Record<string, unknown>; userIds: string[] };

function createEngagementService(options: {
  candidates?: Candidate[];
  rpcError?: string;
  insertError?: string;
  updateError?: string;
  emailMap?: Map<string, string>;
  lifecycleEnabled?: Map<string, boolean>;
}) {
  const rpcCalls: RpcCall[] = [];
  const insertCalls: InsertCall[] = [];
  const updateCalls: UpdateCall[] = [];
  let capturedUserIds: string[] = [];

  const rpc = vi.fn((fn: string, args: Record<string, unknown>) => {
    rpcCalls.push({ fn, args });
    if (options.rpcError) {
      return Promise.resolve({ data: null, error: { message: options.rpcError } });
    }
    return Promise.resolve({ data: options.candidates ?? [], error: null });
  });

  const from = vi.fn((table: string) => {
    if (table === "communes") {
      return stubChain({ data: [{ id: COMMUNE_ID, name: "Les Authieux" }], error: null });
    }
    if (table === "user_notification_preferences") {
      return {
        ...stubChain({ data: [], error: null }),
        select: vi.fn(() => ({
          in: vi.fn((_col: string, userIds: string[]) => {
            const rows = userIds
              .filter((id) => options.lifecycleEnabled?.has(id))
              .map((id) => ({
                user_id: id,
                email_lifecycle_enabled: options.lifecycleEnabled?.get(id) ?? true,
              }));
            return Promise.resolve({ data: rows, error: null });
          }),
        })),
      };
    }
    if (table === "email_queue") {
      return {
        insert: vi.fn((rows: unknown[]) => {
          insertCalls.push({ table, rows });
          if (options.insertError) {
            return Promise.resolve({ error: { message: options.insertError } });
          }
          return Promise.resolve({ error: null });
        }),
      };
    }
    if (table === "profiles") {
      return {
        update: vi.fn((payload: Record<string, unknown>) => ({
          in: vi.fn((_col: string, userIds: string[]) => {
            capturedUserIds = userIds;
            updateCalls.push({ table, payload, userIds });
            if (options.updateError) {
              return Promise.resolve({ error: { message: options.updateError } });
            }
            return Promise.resolve({ error: null });
          }),
        })),
      };
    }
    return stubChain({ data: [], error: null });
  });

  return { service: { rpc, from }, rpcCalls, insertCalls, updateCalls, getCapturedUserIds: () => capturedUserIds };
}

async function mockEmailsByUserIds(emailMap: Map<string, string>) {
  const { getEmailsByUserIds } = await import("@/lib/services/user-emails");
  vi.mocked(getEmailsByUserIds).mockResolvedValue(emailMap);
}

async function mockNotifyUser() {
  const { notifyUser } = await import("@/lib/services/push-notifications");
  vi.mocked(notifyUser).mockResolvedValue(undefined);
  return vi.mocked(notifyUser);
}

describe("collectEngagementReminders", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("calls the RPC with correct bounds and limit, emits no content table reads", async () => {
    const emailMap = new Map([[USER_ID_1, "user1@example.test"]]);
    await mockEmailsByUserIds(emailMap);
    await mockNotifyUser();

    const { service, rpcCalls } = createEngagementService({
      candidates: [{ user_id: USER_ID_1, display_name: "Alice", active_commune_id: COMMUNE_ID }],
      emailMap,
    });

    const { collectEngagementReminders } = await import("@/lib/cron/lifecycle-collector");
    await collectEngagementReminders(service as never);

    expect(rpcCalls).toHaveLength(1);
    expect(rpcCalls[0].fn).toBe("select_engagement_candidates");
    expect(rpcCalls[0].args).toMatchObject({
      p_limit: 200,
    });
    // Verify p_created_after and p_created_before are ISO date strings
    expect(typeof rpcCalls[0].args.p_created_after).toBe("string");
    expect(typeof rpcCalls[0].args.p_created_before).toBe("string");

    // Verify no calls to announcements, initiatives, events tables
    const fromCalls = vi.mocked(service.from).mock.calls.map((c) => c[0]);
    expect(fromCalls).not.toContain("announcements");
    expect(fromCalls).not.toContain("initiatives");
    expect(fromCalls).not.toContain("events");
  });

  it("throws and sends no reminders when RPC fails", async () => {
    await mockEmailsByUserIds(new Map());
    await mockNotifyUser();

    const { service, insertCalls } = createEngagementService({
      rpcError: "Connection refused",
    });

    const { collectEngagementReminders } = await import("@/lib/cron/lifecycle-collector");

    await expect(collectEngagementReminders(service as never)).rejects.toThrow(
      "collectEngagementReminders(rpc): Connection refused"
    );
    expect(insertCalls).toHaveLength(0);
  });

  it("throws when email_queue insert fails", async () => {
    const emailMap = new Map([[USER_ID_1, "user1@example.test"]]);
    await mockEmailsByUserIds(emailMap);
    await mockNotifyUser();

    const { service } = createEngagementService({
      candidates: [{ user_id: USER_ID_1, display_name: "Alice", active_commune_id: COMMUNE_ID }],
      insertError: "Unique constraint violated",
    });

    const { collectEngagementReminders } = await import("@/lib/cron/lifecycle-collector");

    await expect(collectEngagementReminders(service as never)).rejects.toThrow(
      "collectEngagementReminders(insert): Unique constraint violated"
    );
  });

  it("throws when profile marking fails", async () => {
    const emailMap = new Map([[USER_ID_1, "user1@example.test"]]);
    await mockEmailsByUserIds(emailMap);
    await mockNotifyUser();

    const { service } = createEngagementService({
      candidates: [{ user_id: USER_ID_1, display_name: "Alice", active_commune_id: COMMUNE_ID }],
      updateError: "Database unavailable",
    });

    const { collectEngagementReminders } = await import("@/lib/cron/lifecycle-collector");

    await expect(collectEngagementReminders(service as never)).rejects.toThrow(
      "collectEngagementReminders(mark): Database unavailable"
    );
  });

  it("sends push notification but no email when lifecycle emails are disabled", async () => {
    const emailMap = new Map([[USER_ID_1, "user1@example.test"]]);
    await mockEmailsByUserIds(emailMap);
    const notifyUser = await mockNotifyUser();

    const lifecycleEnabled = new Map([[USER_ID_1, false]]);
    const { service, insertCalls, getCapturedUserIds } = createEngagementService({
      candidates: [{ user_id: USER_ID_1, display_name: "Alice", active_commune_id: COMMUNE_ID }],
      lifecycleEnabled,
    });

    const { collectEngagementReminders } = await import("@/lib/cron/lifecycle-collector");
    const result = await collectEngagementReminders(service as never);

    // Push notification should be sent
    expect(notifyUser).toHaveBeenCalledWith(
      USER_ID_1,
      expect.objectContaining({
        title: "Publiez votre première annonce !",
        tag: "engagement-first-week",
      })
    );

    // No email should be queued
    expect(insertCalls).toHaveLength(0);

    // User should still be marked (push was sent)
    expect(getCapturedUserIds()).toContain(USER_ID_1);
    expect(result.count).toBe(1);
  });
});

describe("runLifecycleCollector — phase isolation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("continues running subsequent phases when one phase fails", async () => {
    await mockEmailsByUserIds(new Map());
    await mockNotifyUser();

    let engagementCalled = false;
    let notificationCalled = false;

    // Create a service that fails on engagement but succeeds on notification
    const rpc = vi.fn((fn: string) => {
      if (fn === "select_engagement_candidates") {
        engagementCalled = true;
        return Promise.resolve({ data: null, error: { message: "Engagement failed" } });
      }
      if (fn === "select_notification_activation_candidates") {
        notificationCalled = true;
        return Promise.resolve({ data: [], error: null });
      }
      return Promise.resolve({ data: [], error: null });
    });

    const from = vi.fn((table: string) => {
      // Return empty results for all tables to avoid errors in other phases
      if (table === "announcements" || table === "initiatives" || table === "events") {
        return {
          ...stubChain({ data: [], error: null }),
          delete: vi.fn(() => stubChain({ data: [], error: null })),
        };
      }
      if (table === "conversation_participants") {
        return {
          ...stubChain({ data: [], error: null }),
          delete: vi.fn(() => stubChain({ data: [], error: null })),
        };
      }
      if (table === "neighbor_invites") {
        return stubChain({ data: [], error: null });
      }
      return stubChain({ data: [], error: null });
    });

    const service = { rpc, from };

    const { runLifecycleCollector } = await import("@/lib/cron/lifecycle-collector");
    const result = await runLifecycleCollector(service as never);

    // Both phases should have been attempted
    expect(engagementCalled).toBe(true);
    expect(notificationCalled).toBe(true);

    // The failed phase should be recorded
    expect(result.failedPhases).toHaveLength(1);
    expect(result.failedPhases[0]).toEqual({
      phase: "collectEngagementReminders",
      message: "collectEngagementReminders(rpc): Engagement failed",
    });

    // Notification reminder should show 0 (no candidates) but not fail
    expect(result.queued.notificationReminder).toBe(0);
  });

  it("records multiple phase failures without stopping", async () => {
    await mockEmailsByUserIds(new Map());
    await mockNotifyUser();

    const rpc = vi.fn((fn: string) => {
      if (fn === "select_engagement_candidates") {
        return Promise.resolve({ data: null, error: { message: "Engagement RPC failed" } });
      }
      if (fn === "select_notification_activation_candidates") {
        return Promise.resolve({ data: null, error: { message: "Notification RPC failed" } });
      }
      return Promise.resolve({ data: [], error: null });
    });

    const from = vi.fn(() => stubChain({ data: [], error: null }));
    const service = { rpc, from };

    const { runLifecycleCollector } = await import("@/lib/cron/lifecycle-collector");
    const result = await runLifecycleCollector(service as never);

    // Both failures should be recorded
    expect(result.failedPhases.length).toBeGreaterThanOrEqual(2);
    const phases = result.failedPhases.map((f) => f.phase);
    expect(phases).toContain("collectEngagementReminders");
    expect(phases).toContain("collectNotificationReminders");
  });
});
