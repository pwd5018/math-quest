import { describe, expect, it } from "vitest";
import {
  lessons,
  answerFor,
  equationFor,
  questionFor,
  initialModel,
  gradeModel,
  restoreJournal,
  observeLesson,
} from "./lessons";

describe("separate concept lessons", () => {
  it("provides four distinct concepts for each subject with valid new checks", () => {
    expect(new Set(lessons.map((l) => l.id)).size).toBe(8);
    for (const subject of ["multiplication", "division"])
      expect(lessons.filter((l) => l.subject === subject)).toHaveLength(4);
    for (const lesson of lessons) {
      expect(lesson.checks).toHaveLength(2);
      for (const example of lesson.checks) {
        expect(example.groups).toBeGreaterThan(0);
        expect(example.each).toBeLessThanOrEqual(6);
        expect(questionFor(lesson, example).length).toBeGreaterThan(20);
        expect(Number.isInteger(answerFor(lesson, example))).toBe(true);
      }
      expect(gradeModel(lesson, initialModel(lesson)).correct).toBe(false);
      const model = {
        ...initialModel(lesson),
        counts: Array(lesson.example.groups).fill(lesson.example.each),
        terms: Array(lesson.example.groups).fill(lesson.example.each),
        jumps: Array.from(
          { length: lesson.example.groups + 1 },
          (_, i) => i * lesson.example.each,
        ),
        rows: lesson.example.groups,
        columns: lesson.example.each,
        roles: [
          lesson.example.groups * lesson.example.each,
          lesson.example.groups,
          lesson.example.each,
        ],
      };
      expect(gradeModel(lesson, model).correct, lesson.id).toBe(true);
    }
  });
  it("distinguishes sharing amounts from counting full groups", () => {
    const sharing = lessons.find((l) => l.model === "sharing")!,
      packing = lessons.find((l) => l.model === "packing")!;
    expect(equationFor(sharing, sharing.example)).toBe("12 ÷ 3");
    expect(answerFor(sharing, sharing.example)).toBe(4);
    expect(equationFor(packing, packing.example)).toBe("12 ÷ 4");
    expect(answerFor(packing, packing.example)).toBe(3);
    expect(questionFor(packing, packing.example)).toContain(
      "How many full baskets",
    );
  });
  it("requires the model to match the concept, not just the total", () => {
    for (const model of ["groups", "sharing", "division-array"]) {
      const lesson = lessons.find((l) => l.model === model)!;
      expect(
        gradeModel(lesson, { ...initialModel(lesson), counts: [3, 4, 5] })
          .correct,
      ).toBe(false);
    }
    const addition = lessons.find((l) => l.model === "addition")!;
    expect(
      gradeModel(addition, { ...initialModel(addition), terms: [2, 4, 6] })
        .correct,
    ).toBe(false);
    const jumps = lessons.find((l) => l.model === "jumps")!;
    expect(
      gradeModel(jumps, { ...initialModel(jumps), jumps: [0, 12] }).correct,
    ).toBe(false);
    const array = lessons.find((l) => l.model === "array")!;
    expect(
      gradeModel(array, { ...initialModel(array), rows: 2, columns: 6 })
        .correct,
    ).toBe(false);
    const equation = lessons.find((l) => l.model === "equation")!;
    expect(
      gradeModel(equation, { ...initialModel(equation), roles: [12, 4, 3] })
        .correct,
    ).toBe(false);
  });
  it("keeps independent and supported checks per concept and bounds restored notes", () => {
    const a = observeLesson({}, "equal-groups", "explored"),
      b = observeLesson(a, "equal-groups", "independent"),
      c = observeLesson(b, "equal-groups", "supported");
    expect(c["equal-groups"]).toEqual({
      explored: 1,
      independent: 1,
      supported: 1,
    });
    expect(a["equal-groups"].independent).toBe(0);
    expect(c["equal-sharing"]).toBeUndefined();
    expect(observeLesson(c, "forged", "explored")).toBe(c);
    expect(
      restoreJournal({
        "equal-groups": {
          explored: Infinity,
          supported: -1,
          independent: 100000,
          coins: 999,
        },
        forged: { explored: 1 },
      }),
    ).toEqual({
      "equal-groups": { explored: 0, supported: 0, independent: 9999 },
    });
    expect(restoreJournal(null)).toEqual({});
  });
});
