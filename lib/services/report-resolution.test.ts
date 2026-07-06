import { beforeEach, describe, expect, it, vi } from "vitest";

const mockUpdate = vi.fn().mockReturnValue({
  eq: vi.fn().mockReturnThis(),
  in: vi.fn().mockResolvedValue({ error: null }),
});

const mockFrom = vi.fn().mockReturnValue({
  update: mockUpdate,
  select: vi.fn().mockReturnValue({
    eq: vi.fn().mockResolvedValue({ data: [] }),
  }),
});

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({ from: mockFrom })),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

describe("resolvePendingReportsForContent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates pending reports for the given content", async () => {
    const { resolvePendingReportsForContent } = await import(
      "@/lib/services/report-resolution"
    );

    await resolvePendingReportsForContent(
      "announcement",
      "00000000-0000-4000-8000-000000000001",
      "00000000-0000-4000-8000-000000000002",
      "content_suspended",
      "00000000-0000-4000-8000-000000000003",
    );

    expect(mockFrom).toHaveBeenCalledWith("reports");
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "reviewed",
        resolution: "content_suspended",
      }),
    );
  });
});
