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
