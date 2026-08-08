/**
 * Recipient-selection guard for the commune fan-out.
 *
 * These cases lock the *who gets notified* contract. They do NOT survive the
 * rewrite planned in docs/scaling-roadmap.md, sujet 4, as-is: the query stub
 * below exposes no `range()`, and the assertions read `notifyUser` calls that
 * the bulk-insert rewrite removes. Port the seven cases to the new surface
 * rather than assuming they still pass.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createServiceClient: vi.fn(),
}));

vi.mock("@/lib/services/push-notifications", () => ({
  notifyUser: vi.fn(),
}));

const COMMUNE_ID = "27027000-0000-4000-8000-000000000001";
const AUTHOR_ID = "27027000-0000-4000-8000-000000000010";
const NEIGHBOUR_A = "27027000-0000-4000-8000-000000000011";
const NEIGHBOUR_B = "27027000-0000-4000-8000-000000000012";
const CONTENT_ID = "27027000-0000-4000-8000-0000000000a1";

type QueryResult = { data: unknown[] | null };

/** Minimal PostgREST-like builder: filters chain, awaiting the builder yields `result`. */
function stubQuery(result: QueryResult) {
  const builder = {
    select: vi.fn(),
    eq: vi.fn(),
    neq: vi.fn(),
    in: vi.fn(),
    then: (onFulfilled: (value: QueryResult) => unknown) =>
      Promise.resolve(result).then(onFulfilled),
  };
  builder.select.mockReturnValue(builder);
  builder.eq.mockReturnValue(builder);
  builder.neq.mockReturnValue(builder);
  builder.in.mockReturnValue(builder);
  return builder;
}

function stubClient(options: {
  members: string[];
  preferences?: Array<Record<string, unknown>>;
}) {
  const memberships = stubQuery({
    data: options.members.map((user_id) => ({ user_id })),
  });
  const preferences = stubQuery({ data: options.preferences ?? [] });
  const from = vi.fn((table: string) =>
    table === "memberships" ? memberships : preferences,
  );
  return { client: { from }, from, memberships, preferences };
}

async function runFanout(
  client: unknown,
  overrides: { excludeUserIds?: string[] } = {},
) {
  const { createServiceClient } = await import("@/lib/supabase/server");
  vi.mocked(createServiceClient).mockResolvedValue(client as never);

  const { fanoutNewContentNotification } = await import(
    "@/lib/services/notification-fanout"
  );
  await fanoutNewContentNotification({
    contextType: "announcement",
    contextId: CONTENT_ID,
    communeId: COMMUNE_ID,
    authorUserId: AUTHOR_ID,
    title: "Besoin d'un coup de main au jardin",
    authorDisplayName: "Camille D.",
    ...overrides,
  });
}

/** Recipient user ids passed to `notifyUser`, in call order. */
function notifiedUserIds(notifyUser: ReturnType<typeof vi.fn>): string[] {
  return notifyUser.mock.calls.map((call) => call[0] as string);
}

describe("fanoutNewContentNotification — recipient selection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("asks the database to exclude the author", async () => {
    const { client, memberships } = stubClient({ members: [NEIGHBOUR_A] });
    await runFanout(client);

    expect(memberships.eq).toHaveBeenCalledWith("commune_id", COMMUNE_ID);
    expect(memberships.eq).toHaveBeenCalledWith("status", "active");
    expect(memberships.neq).toHaveBeenCalledWith("user_id", AUTHOR_ID);
  });

  it("notifies every active member returned by the query", async () => {
    const { client } = stubClient({ members: [NEIGHBOUR_A, NEIGHBOUR_B] });
    await runFanout(client);

    const { notifyUser } = await import("@/lib/services/push-notifications");
    expect(notifiedUserIds(vi.mocked(notifyUser))).toEqual([
      NEIGHBOUR_A,
      NEIGHBOUR_B,
    ]);
  });

  it("skips a member who opted out of this content kind", async () => {
    const { client } = stubClient({
      members: [NEIGHBOUR_A, NEIGHBOUR_B],
      preferences: [
        { user_id: NEIGHBOUR_A, notify_new_announcement: false },
        { user_id: NEIGHBOUR_B, notify_new_announcement: true },
      ],
    });
    await runFanout(client);

    const { notifyUser } = await import("@/lib/services/push-notifications");
    expect(notifiedUserIds(vi.mocked(notifyUser))).toEqual([NEIGHBOUR_B]);
  });

  it("treats a member without a preferences row as opted in", async () => {
    const { client } = stubClient({
      members: [NEIGHBOUR_A, NEIGHBOUR_B],
      preferences: [{ user_id: NEIGHBOUR_A, notify_new_announcement: true }],
    });
    await runFanout(client);

    const { notifyUser } = await import("@/lib/services/push-notifications");
    expect(notifiedUserIds(vi.mocked(notifyUser))).toEqual([
      NEIGHBOUR_A,
      NEIGHBOUR_B,
    ]);
  });

  it("honours excludeUserIds", async () => {
    const { client } = stubClient({ members: [NEIGHBOUR_A, NEIGHBOUR_B] });
    await runFanout(client, { excludeUserIds: [NEIGHBOUR_A] });

    const { notifyUser } = await import("@/lib/services/push-notifications");
    expect(notifiedUserIds(vi.mocked(notifyUser))).toEqual([NEIGHBOUR_B]);
  });

  it("returns without reading preferences when the commune has no other member", async () => {
    const { client, from } = stubClient({ members: [] });
    await runFanout(client);

    const { notifyUser } = await import("@/lib/services/push-notifications");
    expect(notifyUser).not.toHaveBeenCalled();
    expect(from).toHaveBeenCalledTimes(1);
    expect(from).toHaveBeenCalledWith("memberships");
  });

  it("never swallows an error while the stubs are well-formed", async () => {
    // The production function catches everything and only logs. Without this
    // assertion a broken stub would make the cases above pass vacuously.
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { client } = stubClient({ members: [NEIGHBOUR_A] });
    await runFanout(client);

    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });
});
