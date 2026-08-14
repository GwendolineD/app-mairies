import { describe, expect, it } from "vitest";
import { applyProspectOutreachStatusRules } from "@/lib/prospect-outreach/status-rules";

describe("applyProspectOutreachStatusRules", () => {
  it("auto moves to in_progress when first contact date is newly set", () => {
    const result = applyProspectOutreachStatusRules(
      {
        status: "not_contacted",
        first_contact_at: "2026-08-01T10:00:00.000Z",
      },
      { status: "not_contacted", outcome: null, first_contact_at: null },
    );

    expect(result.errors).toHaveLength(0);
    expect(result.data.status).toBe("in_progress");
  });

  it("keeps manual not_contacted when contact date already existed", () => {
    const result = applyProspectOutreachStatusRules(
      {
        status: "not_contacted",
        first_contact_at: "2026-08-01T10:00:00.000Z",
      },
      {
        status: "in_progress",
        outcome: null,
        first_contact_at: "2026-08-01T10:00:00.000Z",
      },
    );

    expect(result.data.status).toBe("not_contacted");
  });

  it("requires outcome when completed", () => {
    const result = applyProspectOutreachStatusRules(
      { status: "completed", outcome: null },
      { status: "in_progress", outcome: null, first_contact_at: null },
    );

    expect(result.errors[0]?.field).toBe("outcome");
  });

  it("clears outcome when not completed", () => {
    const result = applyProspectOutreachStatusRules(
      { status: "in_progress", outcome: "adhesion" },
      {
        status: "completed",
        outcome: "adhesion",
        first_contact_at: null,
      },
    );

    expect(result.data.outcome).toBeNull();
  });
});
