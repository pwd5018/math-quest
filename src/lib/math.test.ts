import { describe, expect, it } from "vitest";
import { generateQuestion, checkAnswer, skills } from "./math";
describe("deterministic third-grade math", () => {
  for (const skill of skills)
    for (const level of [1, 2, 3])
      it(`${skill} level ${level}: 1,000 valid generated questions`, () => {
        const seen = new Set<string>();
        for (let seed = 0; seed < 1000; seed++) {
          const q = generateQuestion(skill, level, seed * 73, seed % 10);
          seen.add(`${q.a},${q.b}`);
          expect(q).toEqual(
            generateQuestion(skill, level, seed * 73, seed % 10),
          );
          expect(Number.isSafeInteger(q.answer)).toBe(true);
          expect(q.answer).toBeGreaterThanOrEqual(0);
          expect(checkAnswer(q, String(q.answer))).toBe(true);
          expect(checkAnswer(q, String(q.answer + 1))).toBe(false);
          if (skill === "addition") {
            expect(q.a + q.b).toBe(q.answer);
            expect(q.answer).toBeLessThanOrEqual([20, 100, 1000][level - 1]);
          }
          if (skill === "subtraction") {
            expect(q.a - q.b).toBe(q.answer);
            expect(q.a).toBeLessThanOrEqual([20, 100, 1000][level - 1]);
          }
          if (skill === "multiplication") {
            expect(q.a * q.b).toBe(q.answer);
            expect(q.a).toBeLessThanOrEqual([3, 5, 12][level - 1]);
            expect(q.b).toBeLessThanOrEqual([5, 12, 12][level - 1]);
          }
          if (skill === "division") {
            expect(q.a / q.b).toBe(q.answer);
            expect(q.a % q.b).toBe(0);
            expect(q.b).toBeGreaterThan(0);
            expect(q.answer).toBeLessThanOrEqual(10);
            expect(q.b).toBeLessThanOrEqual([3, 5, 10][level - 1]);
          }
        }
        expect(seen.size).toBeGreaterThan(10);
      });
  it("rejects malformed, negative, decimal and exponential input", () => {
    const q = generateQuestion("addition", 1, 5, 0);
    for (const s of ["", " ", "1e1", "-2", "3.0", "Infinity", "NaN", "5 cats"])
      expect(checkAnswer(q, s)).toBe(false);
  });
  it("includes varied word problems with the same deterministic answer", () => {
    for (const s of skills) {
      const q = generateQuestion(s, 2, 400, 2);
      expect(q.story).toContain(String(q.a));
      expect(q.story).toContain(String(q.b));
    }
  });
});
