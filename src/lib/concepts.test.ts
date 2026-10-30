import { describe, expect, it } from "vitest";
import {
  checkGroups,
  emptyConceptNote,
  recordConceptCheck,
  restoreConceptNote,
} from "./concepts";

describe("concept learning observations", () => {
  it("checks equal groups rather than accepting the right total in unequal groups", () => {
    expect(checkGroups([3, 4, 5], 3, 4)).toEqual({
      correct: false,
      message:
        "Blanket 1 has 3 berries. Add 1 more to make 4. Every blanket needs 4.",
    });
    expect(checkGroups([5, 4, 3], 3, 4).message).toContain("Take away 1");
    expect(checkGroups([4, 4, 4], 3, 4).correct).toBe(true);
    expect(checkGroups([4, 4], 3, 4).correct).toBe(false);
    expect(checkGroups([NaN, 4, 4], 3, 4).correct).toBe(false);
  });
  it("records supported and independent concept checks without economy or mastery fields", () => {
    const initial = emptyConceptNote();
    const supported = recordConceptCheck(initial, "multiplication", true);
    expect(supported.multiplication).toBe("with-help");
    expect(initial.multiplication).toBe("not-tried");
    const independent = recordConceptCheck(supported, "multiplication", false);
    expect(independent.multiplication).toBe("independent");
    expect(
      recordConceptCheck(independent, "multiplication", true).multiplication,
    ).toBe("independent");
    expect(independent.sharing).toBe("not-tried");
    expect(Object.keys(independent).sort()).toEqual([
      "completed",
      "multiplication",
      "sharing",
      "visits",
    ]);
  });
  it("restores bounded device notes and discards forged fields and invalid values", () => {
    expect(restoreConceptNote(null)).toEqual(emptyConceptNote());
    expect(
      restoreConceptNote({
        visits: Infinity,
        completed: -1,
        multiplication: "mastered",
        sharing: "independent",
        coins: 999,
      }),
    ).toEqual({ ...emptyConceptNote(), sharing: "independent" });
    expect(
      restoreConceptNote({
        visits: 10000,
        completed: 2,
        multiplication: "with-help",
      }),
    ).toEqual({
      ...emptyConceptNote(),
      visits: 9999,
      completed: 2,
      multiplication: "with-help",
    });
  });
});
