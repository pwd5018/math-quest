import { describe, expect, it } from "vitest";
import { generateQuestion, type Skill } from "./math";
import type { Attempt } from "./learning";
import { adventureHighlights, numberHop } from "./practiceTools";

describe("hands-on number line", () => {
  it("reaches the exact answer without overshooting at every difficulty", () => {
    for (const skill of ["addition", "subtraction"] as Skill[]) {
      for (const level of [1, 2, 3]) {
        for (let seed = 0; seed < 100; seed++) {
          const q = generateQuestion(skill, level, seed, 0);
          let moved = 0;
          let position = q.a;
          while (moved < q.b) {
            const hop = numberHop(q, moved, 100);
            expect(hop.distance).toBeGreaterThan(0);
            moved = hop.moved;
            position = hop.position;
            expect(position).toBeGreaterThanOrEqual(0);
          }
          expect(moved).toBe(q.b);
          expect(position).toBe(q.answer);
          expect(numberHop(q, moved, 10).distance).toBe(0);
        }
      }
    }
  });
});

describe("adventure highlights", () => {
  const makeAttempt = (
    id: string,
    overrides: Partial<Attempt> = {},
  ): Attempt => ({
    id,
    sessionId: "current",
    skill: "multiplication",
    level: 1,
    question: {
      ...generateQuestion("multiplication", 1, 2, 0),
      id,
      selection: "review",
    },
    independent: true,
    firstAnswer: "6",
    hints: 0,
    wrongAnswers: 0,
    coins: 3,
    at: "2026-10-29T12:00:00Z",
    ...overrides,
  });
  it("uses only this adventure and never presents supported review as independent", () => {
    const independent = makeAttempt("one");
    const result = adventureHighlights(
      [
        makeAttempt("old", { sessionId: "another" }),
        independent,
        independent,
        makeAttempt("retry", { independent: false, wrongAnswers: 1 }),
        makeAttempt("hint", { independent: false, hints: 1 }),
      ],
      "current",
    );
    expect(result.reviewed).toBe(1);
    expect(result.supported).toBe(2);
    expect(result.retried).toBe(1);
    expect(result.discoveries.map((q) => q.id)).toEqual(["one"]);
  });
  it("does not invent highlights when no detailed history is loaded", () => {
    expect(adventureHighlights([], "current")).toEqual({
      reviewed: 0,
      supported: 0,
      retried: 0,
      discoveries: [],
    });
  });
});
