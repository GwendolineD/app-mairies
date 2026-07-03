import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn((path: string) => {
    throw new Error(`REDIRECT:${path}`);
  }),
}));

describe("getSessionContext", () => {
  it("returns null when user is not authenticated", async () => {
    const { createClient } = await import("@/lib/supabase/server");
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
      },
    } as never);

    const { getSessionContext } = await import("@/lib/auth/session");
    const ctx = await getSessionContext();
    expect(ctx).toBeNull();
  });
});

describe("requireAuth", () => {
  it("redirects when session is missing", async () => {
    const { createClient } = await import("@/lib/supabase/server");
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
      },
    } as never);

    const { requireAuth } = await import("@/lib/auth/session");
    await expect(requireAuth()).rejects.toThrow("REDIRECT:");
  });
});
