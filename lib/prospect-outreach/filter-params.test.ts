import { describe, expect, it } from "vitest";
import {
  activeProspectCommunesFilterCount,
  buildProspectCommunesQuery,
  parseProspectCommunesParams,
} from "@/lib/prospect-communes/filter-params";

describe("prospect outreach status filters in URL", () => {
  it("parses multi statut params", () => {
    const params = parseProspectCommunesParams({
      statut: ["in_progress", "completed"],
    });

    expect(params.outreachStatuses).toEqual(["in_progress", "completed"]);
  });

  it("serializes statut in query string", () => {
    const query = buildProspectCommunesQuery({
      q: "",
      maire: "",
      populationBuckets: [],
      cp: "",
      openingDays: [],
      departments: [],
      view: "list",
      outreachStatuses: ["not_contacted", "in_progress"],
    });

    expect(query).toContain("statut=not_contacted");
    expect(query).toContain("statut=in_progress");
  });

  it("counts outreach status as active filter", () => {
    const count = activeProspectCommunesFilterCount({
      q: "",
      maire: "",
      populationBuckets: [],
      cp: "",
      openingDays: [],
      departments: [],
      view: "list",
      outreachStatuses: ["completed"],
    });

    expect(count).toBe(1);
  });
});

describe("prospect visit and council date filters in URL", () => {
  it("parses visite and conseil params", () => {
    const params = parseProspectCommunesParams({
      visite: "2026-08-17",
      conseil: "2026-09-01",
    });

    expect(params.visitDate).toBe("2026-08-17");
    expect(params.councilDate).toBe("2026-09-01");
  });

  it("ignores invalid date params", () => {
    const params = parseProspectCommunesParams({
      visite: "17/08/2026",
      conseil: "not-a-date",
    });

    expect(params.visitDate).toBeUndefined();
    expect(params.councilDate).toBeUndefined();
  });

  it("serializes visite and conseil in query string", () => {
    const query = buildProspectCommunesQuery({
      q: "",
      maire: "",
      populationBuckets: [],
      cp: "",
      openingDays: [],
      departments: [],
      view: "list",
      outreachStatuses: [],
      visitDate: "2026-08-17",
      councilDate: "2026-09-01",
    });

    expect(query).toContain("visite=2026-08-17");
    expect(query).toContain("conseil=2026-09-01");
  });

  it("counts visit and council dates as separate active filters", () => {
    const count = activeProspectCommunesFilterCount({
      q: "",
      maire: "",
      populationBuckets: [],
      cp: "",
      openingDays: [],
      departments: [],
      view: "list",
      outreachStatuses: [],
      visitDate: "2026-08-17",
      councilDate: "2026-09-01",
    });

    expect(count).toBe(2);
  });
});
