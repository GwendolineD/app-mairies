/**
 * Queue state-transition guard for the lifecycle email sender.
 *
 * These cases lock the `email_queue` status machine, which must survive the
 * planned introduction of a claim mechanism. See docs/scaling-roadmap.md,
 * sujets 2 and 5.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/email/render-template", () => ({
  sendTemplatedEmail: vi.fn(),
}));

const ENTRY_ID = "27027000-0000-4000-8000-0000000000e1";
const USER_ID = "27027000-0000-4000-8000-000000000011";
const RECIPIENT = "voisine@example.test";

type QueueEntry = {
  id: string;
  to_email: string;
  template_slug: string;
  variables: Record<string, string>;
  attempts: number;
  max_attempts: number;
  scheduled_at: string;
  related_content_type: string | null;
  related_content_id: string | null;
  recipient_user_id: string | null;
};

function queueEntry(overrides: Partial<QueueEntry> = {}): QueueEntry {
  return {
    id: ENTRY_ID,
    to_email: RECIPIENT,
    template_slug: "engagement-first-week",
    variables: { user_name: "Camille" },
    attempts: 0,
    max_attempts: 3,
    scheduled_at: "2026-08-01T06:00:00.000Z",
    related_content_type: null,
    related_content_id: null,
    recipient_user_id: USER_ID, // default: has an account
    ...overrides,
  };
}

type Thenable = {
  then: (onFulfilled: (value: unknown) => unknown) => Promise<unknown>;
};

/**
 * Minimal PostgREST-like builder. Every filter returns the builder itself, and
 * the builder is thenable, so both `.limit(n)` and `.maybeSingle()` resolve to
 * `result` once awaited.
 */
function stubChain(result: unknown): Record<string, unknown> & Thenable {
  const builder: Record<string, unknown> = {
    then: (onFulfilled: (value: unknown) => unknown) =>
      Promise.resolve(result).then(onFulfilled),
  };
  for (const method of ["select", "eq", "lte", "order", "limit", "maybeSingle"]) {
    builder[method] = vi.fn(() => builder);
  }
  return builder as Record<string, unknown> & Thenable;
}

type QueueUpdate = { payload: Record<string, unknown>; id: string };
type RpcCall = { name: string; params: Record<string, unknown> };

const DEFAULT_LOCK_ID = "test-lock-id-12345";

function createService(options: {
  entries: QueueEntry[];
  /** `undefined` means no preferences row exists for the user. */
  lifecycleEnabled?: boolean;
  /** If false, try_acquire_cron_lock returns null (lock not acquired). Default: true. */
  lockAcquired?: boolean;
}) {
  const updates: QueueUpdate[] = [];
  const rpcCalls: RpcCall[] = [];

  const from = vi.fn((table: string) => {
    if (table === "email_queue") {
      return {
        ...stubChain({ data: options.entries, error: null }),
        update: (payload: Record<string, unknown>) => ({
          eq: vi.fn((_column: string, id: string) => {
            updates.push({ payload, id });
            return Promise.resolve({ error: null });
          }),
        }),
      };
    }
    // user_notification_preferences lookup
    return stubChain({
      data:
        options.lifecycleEnabled === undefined
          ? null
          : { email_lifecycle_enabled: options.lifecycleEnabled },
    });
  });

  const rpc = vi.fn((name: string, params: Record<string, unknown>) => {
    rpcCalls.push({ name, params });
    if (name === "try_acquire_cron_lock") {
      const acquired = options.lockAcquired ?? true;
      return Promise.resolve({ data: acquired ? DEFAULT_LOCK_ID : null, error: null });
    }
    if (name === "release_cron_lock") {
      return Promise.resolve({ data: null, error: null });
    }
    return Promise.resolve({ data: null, error: null });
  });

  return { service: { from, rpc }, updates, rpcCalls };
}

async function run(service: unknown) {
  const { runEmailSender } = await import("@/lib/cron/email-sender");
  return runEmailSender(service as never);
}

async function mockSend(result: { success: boolean; error?: string }) {
  const { sendTemplatedEmail } = await import("@/lib/email/render-template");
  vi.mocked(sendTemplatedEmail).mockResolvedValue(result as never);
  return vi.mocked(sendTemplatedEmail);
}

describe("runEmailSender — queue state transitions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Keep the suite fast: the production default is a 500ms inter-send delay.
    vi.stubEnv("CRON_EMAIL_DELAY_MS", "0");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("cancels an entry when the recipient disabled lifecycle emails", async () => {
    const send = await mockSend({ success: true });
    const { service, updates } = createService({
      entries: [queueEntry({ recipient_user_id: USER_ID })],
      lifecycleEnabled: false,
    });

    const result = await run(service);

    expect(send).not.toHaveBeenCalled();
    expect(updates).toEqual([
      { payload: { status: "cancelled" }, id: ENTRY_ID },
    ]);
    expect(result).toEqual({ sent: 0, failed: 0, cancelled: 1 });
  });

  it("marks an entry sent on success", async () => {
    const send = await mockSend({ success: true });
    const { service, updates } = createService({
      entries: [queueEntry({ recipient_user_id: USER_ID })],
      lifecycleEnabled: true,
    });

    const result = await run(service);

    expect(send).toHaveBeenCalledWith(RECIPIENT, "engagement-first-week", {
      user_name: "Camille",
    });
    expect(updates).toHaveLength(1);
    expect(updates[0].id).toBe(ENTRY_ID);
    expect(updates[0].payload.status).toBe("sent");
    expect(updates[0].payload.sent_at).toEqual(expect.any(String));
    expect(result).toEqual({ sent: 1, failed: 0, cancelled: 0 });
  });

  it("keeps an entry pending and increments attempts below max_attempts", async () => {
    await mockSend({ success: false, error: "SMTP unreachable" });
    const { service, updates } = createService({
      entries: [queueEntry({ attempts: 0, max_attempts: 3, recipient_user_id: USER_ID })],
      lifecycleEnabled: true,
    });

    const result = await run(service);

    expect(updates).toEqual([
      {
        payload: {
          attempts: 1,
          last_error: "SMTP unreachable",
          status: "pending",
        },
        id: ENTRY_ID,
      },
    ]);
    expect(result).toEqual({ sent: 0, failed: 0, cancelled: 0 });
  });

  it("marks an entry failed once attempts reach max_attempts", async () => {
    await mockSend({ success: false, error: "SMTP unreachable" });
    const { service, updates } = createService({
      entries: [queueEntry({ attempts: 2, max_attempts: 3, recipient_user_id: USER_ID })],
      lifecycleEnabled: true,
    });

    const result = await run(service);

    expect(updates[0].payload.attempts).toBe(3);
    expect(updates[0].payload.status).toBe("failed");
    expect(result).toEqual({ sent: 0, failed: 1, cancelled: 0 });
  });

  it("sends when the recipient has no preferences row", async () => {
    const send = await mockSend({ success: true });
    const { service } = createService({
      entries: [queueEntry({ recipient_user_id: USER_ID })],
      lifecycleEnabled: undefined,
    });

    await run(service);

    expect(send).toHaveBeenCalledOnce();
  });

  it("returns early when the queue is empty", async () => {
    const send = await mockSend({ success: true });
    const { service, updates } = createService({ entries: [] });

    const result = await run(service);

    expect(send).not.toHaveBeenCalled();
    expect(updates).toEqual([]);
    expect(result).toEqual({ sent: 0, failed: 0, cancelled: 0 });
  });

  it("sends invitations (recipient_user_id null) unconditionally", async () => {
    // Invitation recipients have no account, so recipient_user_id is null.
    // They should always receive the email, regardless of preferences.
    const send = await mockSend({ success: true });
    const { service, updates } = createService({
      entries: [queueEntry({ recipient_user_id: null })],
      lifecycleEnabled: false, // opt-out should be ignored for invitations
    });

    const result = await run(service);

    expect(send).toHaveBeenCalledOnce();
    expect(updates).toHaveLength(1);
    expect(updates[0].payload.status).toBe("sent");
    expect(result).toEqual({ sent: 1, failed: 0, cancelled: 0 });
  });
});

describe("runEmailSender — opt-out fix (sujet 2)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("CRON_EMAIL_DELAY_MS", "0");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("cancels entry when recipient_user_id is set and opted out", async () => {
    // This replaces the old characterization test. Before the fix, users beyond
    // the first 50 accounts were not found by listUsers() and emails went out
    // despite opt-out. Now we use recipient_user_id to check preferences directly.
    const send = await mockSend({ success: true });
    const { service, updates } = createService({
      entries: [queueEntry({ recipient_user_id: USER_ID })],
      lifecycleEnabled: false,
    });

    const result = await run(service);

    expect(send).not.toHaveBeenCalled();
    expect(updates).toEqual([
      { payload: { status: "cancelled" }, id: ENTRY_ID },
    ]);
    expect(result).toEqual({ sent: 0, failed: 0, cancelled: 1 });
  });

  it("sends invitation when recipient_user_id is null", async () => {
    // Invitation reminders go to recipients without accounts. The email should
    // be sent regardless of any preference lookup.
    const send = await mockSend({ success: true });
    const { service, updates } = createService({
      entries: [queueEntry({ recipient_user_id: null })],
      lifecycleEnabled: false, // irrelevant for invitations
    });

    const result = await run(service);

    expect(send).toHaveBeenCalledOnce();
    expect(updates).toHaveLength(1);
    expect(updates[0].payload.status).toBe("sent");
    expect(result).toEqual({ sent: 1, failed: 0, cancelled: 0 });
  });
});

describe("runEmailSender — cron lock (sujet 5)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("CRON_EMAIL_DELAY_MS", "0");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("skips when lock is already held by another run", async () => {
    const send = await mockSend({ success: true });
    const { service, updates, rpcCalls } = createService({
      entries: [queueEntry()],
      lockAcquired: false,
    });

    const result = await run(service);

    expect(send).not.toHaveBeenCalled();
    expect(updates).toEqual([]);
    expect(result).toEqual({ sent: 0, failed: 0, cancelled: 0, skipped: true });
    expect(rpcCalls).toEqual([
      { name: "try_acquire_cron_lock", params: { p_name: "email_sender" } },
    ]);
  });

  it("acquires and releases lock on successful run", async () => {
    await mockSend({ success: true });
    const { service, rpcCalls } = createService({
      entries: [queueEntry()],
      lifecycleEnabled: true,
    });

    await run(service);

    expect(rpcCalls).toHaveLength(2);
    expect(rpcCalls[0]).toEqual({
      name: "try_acquire_cron_lock",
      params: { p_name: "email_sender" },
    });
    expect(rpcCalls[1]).toEqual({
      name: "release_cron_lock",
      params: { p_name: "email_sender", p_lock_id: DEFAULT_LOCK_ID },
    });
  });

  it("releases lock even when processing throws an error", async () => {
    const { service, rpcCalls } = createService({
      entries: [queueEntry()],
      lifecycleEnabled: true,
    });

    // Make the from() call for email_queue throw after lock is acquired
    const originalFrom = service.from;
    let callCount = 0;
    service.from = vi.fn((table: string) => {
      callCount++;
      // First call is for email_queue in the main body (after lock acquired)
      if (table === "email_queue" && callCount === 1) {
        return {
          select: () => ({
            eq: () => ({
              lte: () => ({
                order: () => ({
                  limit: () => Promise.resolve({ data: null, error: { message: "DB error" } }),
                }),
              }),
            }),
          }),
        };
      }
      return originalFrom(table);
    });

    await expect(run(service)).rejects.toThrow("runEmailSender(fetch): DB error");

    // Lock should still be released in finally block
    expect(rpcCalls).toHaveLength(2);
    expect(rpcCalls[1]).toEqual({
      name: "release_cron_lock",
      params: { p_name: "email_sender", p_lock_id: DEFAULT_LOCK_ID },
    });
  });

  it("releases lock when queue is empty", async () => {
    const { service, rpcCalls } = createService({
      entries: [],
    });

    const result = await run(service);

    expect(result).toEqual({ sent: 0, failed: 0, cancelled: 0 });
    expect(rpcCalls).toHaveLength(2);
    expect(rpcCalls[1].name).toBe("release_cron_lock");
  });
});

describe("runEmailSender — getDelayMs fix (sujet 5)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("respects CRON_EMAIL_DELAY_MS=0 without fallback to default", async () => {
    vi.clearAllMocks();
    vi.stubEnv("CRON_EMAIL_DELAY_MS", "0");

    await mockSend({ success: true });
    const { service } = createService({
      entries: [queueEntry(), queueEntry({ id: "second-id" })],
      lifecycleEnabled: true,
    });

    const start = Date.now();
    await run(service);
    const elapsed = Date.now() - start;

    // With delay=0, processing two entries should take <100ms (no artificial delay).
    // The old buggy behavior would add 500ms per entry after the first.
    expect(elapsed).toBeLessThan(100);
  });
});
