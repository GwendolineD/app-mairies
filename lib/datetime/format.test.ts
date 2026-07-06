/**
 * Golden tests — expected outputs captured from legacy formatters with TZ=Europe/Paris.
 */
process.env.TZ = "Europe/Paris";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  formatChatDateKey,
  formatChatDayLabel,
  formatChatTime,
  formatCompactShortDate,
  formatDateTimeFr,
  formatDay,
  formatEmailDateTime,
  formatEventAccueilDate,
  formatEventAccueilSchedule,
  formatEventDetail,
  formatEventRange,
  formatInitiativeWhen,
  formatLinkedEventDateTime,
  formatLongDateFr,
  formatMediumDate,
  formatMemberSince,
  formatMessageTime,
  formatMonthShort,
  formatMonthYear,
  formatProfileMonthYear,
  formatShortDate,
  formatShortDateTime,
  formatTimeFr,
} from "./format";

const ISO = "2026-07-03T14:30:00.000Z";
const DATE_ONLY = "2026-07-03";
const START = "2026-07-03T10:00:00.000Z";
const END_SAME = "2026-07-03T18:00:00.000Z";
const END_DIFF = "2026-07-05T18:00:00.000Z";

describe("format golden outputs (Europe/Paris)", () => {
  it("formatShortDate (table)", () => {
    expect(formatShortDate(DATE_ONLY)).toBe("03 juil. 2026");
    expect(formatShortDate(null)).toBe("—");
  });

  it("formatShortDateTime", () => {
    expect(formatShortDateTime(ISO)).toBe("03 juil. 2026 · 16h30");
    expect(formatShortDateTime(null)).toBe("—");
  });

  it("formatCompactShortDate", () => {
    expect(formatCompactShortDate(DATE_ONLY)).toBe("03 juil. 26");
  });

  it("formatMediumDate", () => {
    expect(formatMediumDate(ISO)).toBe("3 juil. 2026");
  });

  it("formatDay", () => {
    expect(formatDay(DATE_ONLY)).toBe("3 juil. 2026");
    expect(formatDay(null)).toBe("—");
  });

  it("formatLongDateFr", () => {
    expect(formatLongDateFr(ISO)).toBe("Vendredi 3 juillet 2026");
  });

  it("formatMonthShort", () => {
    expect(formatMonthShort(ISO)).toBe("juil. 26");
  });

  it("formatMonthYear", () => {
    expect(formatMonthYear(ISO)).toBe("juillet 2026");
  });

  it("formatTimeFr", () => {
    expect(formatTimeFr(ISO)).toBe("16h30");
  });

  it("formatEventRange", () => {
    expect(formatEventRange(START, END_SAME)).toBe(
      "le 3 juillet 2026 de 12h à 20h",
    );
    expect(formatEventRange(START, END_DIFF)).toBe(
      "Du 3 juillet 2026 12h au 5 juillet 2026 20h",
    );
  });

  it("formatEventDetail", () => {
    expect(formatEventDetail(START, END_SAME)).toBe(
      "Vendredi 3 juillet 2026 — de 12h à 20h",
    );
    expect(formatEventDetail(START, END_DIFF)).toBe(
      "Du Vendredi 3 juillet 2026 à 12h au Dimanche 5 juillet 2026 à 20h",
    );
  });

  it("formatLinkedEventDateTime", () => {
    expect(formatLinkedEventDateTime(START, END_SAME)).toBe(
      "Le 3 juillet 2026 de 12h à 20h",
    );
  });

  it("formatMemberSince", () => {
    expect(formatMemberSince(ISO)).toBe("Membre depuis le 3 juillet 2026");
  });

  it("formatEventAccueilDate", () => {
    expect(formatEventAccueilDate(ISO)).toEqual({ day: 3, month: "JUIL" });
  });

  it("formatEventAccueilSchedule", () => {
    expect(formatEventAccueilSchedule(START, END_SAME)).toBe(
      "Vendredi 3 juillet à 12h",
    );
    expect(formatEventAccueilSchedule(START, END_DIFF)).toBe(
      "Du ven. 3 juillet au dim. 5 juillet",
    );
  });

  it("formatInitiativeWhen", () => {
    expect(formatInitiativeWhen("once", ISO)).toBe("Vendredi 3 juillet 2026");
    expect(formatInitiativeWhen("recurring", null)).toBe(
      "Rendez-vous récurrent",
    );
    expect(formatInitiativeWhen("anytime", null)).toBe("À tout moment");
  });

  it("formatMessageTime", () => {
    expect(formatMessageTime(ISO)).toBe("16:30");
  });

  it("chat formatters", () => {
    expect(formatChatDateKey(ISO)).toBe("03/07/2026");
    expect(formatChatTime(ISO)).toBe("16:30");
    expect(formatChatDayLabel("2026-06-01T14:30:00.000Z")).toBe("1 juin 2026");
  });

  it("formatDateTimeFr", () => {
    expect(formatDateTimeFr(ISO)).toBe("03/07/2026 16:30:00");
  });

  it("formatEmailDateTime", () => {
    expect(formatEmailDateTime(ISO)).toBe("03 juil. 2026, 16:30");
  });

  it("formatProfileMonthYear", () => {
    expect(formatProfileMonthYear(ISO)).toBe("juillet 2026");
    expect(formatProfileMonthYear(undefined)).toBe("récemment");
  });
});

describe("formatRelativeTime", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-03T15:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns relative labels", async () => {
    const { formatRelativeTime, formatRelativeTimeAccueil } = await import(
      "./format"
    );
    expect(formatRelativeTime("2026-07-03T14:59:30.000Z")).toBe("à l'instant");
    expect(formatRelativeTime("2026-07-03T14:00:00.000Z")).toBe("il y a 1 h");
    expect(formatRelativeTimeAccueil("2026-07-03T14:00:00.000Z")).toBe(
      "Il y a 1 h",
    );
  });
});

describe("business helpers", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-03T14:30:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("todayParisYmd and addDaysParisYmd", async () => {
    const { todayParisYmd, addDaysParisYmd } = await import("./business");
    expect(todayParisYmd()).toBe("2026-07-03");
    expect(addDaysParisYmd(7)).toBe("2026-07-10");
  });
});

describe("toUtcFromParisLocal", () => {
  it("converts Paris wall clock to UTC ISO", async () => {
    const { toUtcFromParisLocal } = await import("./parse");
    expect(toUtcFromParisLocal("2026-07-03", "14:30")).toBe(
      "2026-07-03T12:30:00.000Z",
    );
    expect(toUtcFromParisLocal("", "14:30")).toBeNull();
  });
});

describe("date range helpers", () => {
  it("resolveEndDateAfterStartChange keeps valid end or bumps to start", async () => {
    const { resolveEndDateAfterStartChange } = await import("./business");
    expect(resolveEndDateAfterStartChange("2026-07-10", "2026-07-15")).toBe(
      "2026-07-15",
    );
    expect(resolveEndDateAfterStartChange("2026-07-10", "2026-07-05")).toBe(
      "2026-07-10",
    );
    expect(resolveEndDateAfterStartChange("", "2026-07-05")).toBe("2026-07-05");
  });

  it("clampEndDate prevents end before start", async () => {
    const { clampEndDate } = await import("./business");
    expect(clampEndDate("2026-07-15", "2026-07-10")).toBe("2026-07-15");
    expect(clampEndDate("2026-07-05", "2026-07-10")).toBe("2026-07-10");
    expect(clampEndDate("2026-07-05", "")).toBe("2026-07-05");
  });
});
