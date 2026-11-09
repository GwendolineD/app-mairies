import { describe, expect, it } from "vitest";
import {
  formatGuestsLabel,
  formatHeadcountLabel,
  formatHeadcountShort,
  formatOwnPartyLabel,
  formatPartySizeLabel,
} from "@/lib/utils/event-headcount";
import { MAX_EVENT_GUESTS } from "@/lib/constants/event-guests";
import {
  eventEngagementCancelSchema,
  eventEngagementInputSchema,
} from "@/lib/validations/schemas";

const EVENT_ID = "27027000-0000-4000-8000-0000000000e1";

describe("event headcount labels", () => {
  it("pluralizes the public headcount", () => {
    expect(formatHeadcountLabel(0)).toBe("0 personnes attendues");
    expect(formatHeadcountLabel(1)).toBe("1 personne attendue");
    expect(formatHeadcountLabel(12)).toBe("12 personnes attendues");
    expect(formatHeadcountShort(1)).toBe("1 personne");
    expect(formatHeadcountShort(12)).toBe("12 personnes");
  });

  it("describes the member's own party", () => {
    expect(formatOwnPartyLabel(0)).toBe("Vous venez seul·e");
    expect(formatOwnPartyLabel(2)).toBe("Vous serez 3");
    expect(formatPartySizeLabel(0)).toBe("1 personne");
    expect(formatPartySizeLabel(2)).toBe("3 personnes");
  });

  it("labels companions chips", () => {
    expect(formatGuestsLabel(1)).toBe("1 accompagnant");
    expect(formatGuestsLabel(2)).toBe("2 accompagnants");
  });
});

describe("event engagement input schema", () => {
  it("accepts both kinds within bounds", () => {
    expect(
      eventEngagementInputSchema.safeParse({
        kind: "participant",
        eventId: EVENT_ID,
        guestsCount: 0,
      }).success,
    ).toBe(true);
    expect(
      eventEngagementInputSchema.safeParse({
        kind: "volunteer",
        eventId: EVENT_ID,
        guestsCount: MAX_EVENT_GUESTS,
      }).success,
    ).toBe(true);
  });

  it("rejects unknown kinds (kind selects the target table)", () => {
    expect(
      eventEngagementInputSchema.safeParse({
        kind: "memberships",
        eventId: EVENT_ID,
        guestsCount: 0,
      }).success,
    ).toBe(false);
    expect(
      eventEngagementCancelSchema.safeParse({ kind: "events", eventId: EVENT_ID }).success,
    ).toBe(false);
  });

  it("rejects out-of-range or non-integer guests", () => {
    for (const guestsCount of [-1, MAX_EVENT_GUESTS + 1, 1.5]) {
      expect(
        eventEngagementInputSchema.safeParse({
          kind: "participant",
          eventId: EVENT_ID,
          guestsCount,
        }).success,
      ).toBe(false);
    }
  });

  it("rejects malformed event ids", () => {
    expect(
      eventEngagementCancelSchema.safeParse({ kind: "participant", eventId: "abc" }).success,
    ).toBe(false);
  });
});
