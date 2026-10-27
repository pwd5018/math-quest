import { describe, it, expect } from "vitest";
import {
  defaultCurriculum,
  reviseCurriculum,
  validateCurriculum,
  selectQuestion,
  factKey,
  factEvidence,
  migrateState,
  type Curriculum,
} from "./curriculum";
import { initialState } from "./storage";
import { generateQuestion, type Question, type Skill } from "./math";
import { advance, initialProgress, type Attempt } from "./learning";
import { awardFor, balance, type LearningEvent } from "./economy";
function event(
  q: Question,
  id: string,
  correct = true,
  kind: "hint" | "answer" = "answer",
): LearningEvent {
  return {
    questionId: id,
    sessionId: id,
    question: q,
    kind,
    ...(kind === "answer"
      ? { answer: String(correct ? q.answer : 999), correct }
      : {}),
    at: "2026-10-26T12:00:00.000Z",
  };
}
function fullPlan(max = 12): Curriculum {
  return { ...defaultCurriculum(), mode: "full-range", maxFactor: max };
}
function adventure(
  seed: number,
  plan: Curriculum,
  events: LearningEvent[] = [],
  skill: Skill = "multiplication",
  level = 1,
) {
  let history = [...events];
  const asked: Question[] = [];
  for (let index = 0; index < 10; index++) {
    const q = selectQuestion({
      skill,
      level,
      seed,
      index,
      sessionId: `run-${seed}`,
      plan,
      events: history,
      asked,
    });
    asked.push(q);
    history.push(event(q, q.id));
  }
  return { questions: asked, events: history };
}
describe("parent-configured curriculum", () => {
  it("defaults to multiplication-only through 12 × 12 with gentle progression", () => {
    expect(defaultCurriculum()).toEqual({
      revision: 1,
      focusSkill: "multiplication",
      enabledSkills: ["multiplication"],
      maxFactor: 12,
      mode: "adaptive",
    });
  });
  it("validates ranges, skills, enabled focus and mode without silently clamping", () => {
    for (const patch of [
      { maxFactor: 13 },
      { maxFactor: 4 },
      { maxFactor: 10.5 },
      { enabledSkills: [] },
      { enabledSkills: ["bogus"] },
      { enabledSkills: ["multiplication", "multiplication"] },
      { focusSkill: "addition" },
      { mode: "unknown" },
    ])
      expect(() =>
        validateCurriculum({ ...defaultCurriculum(), ...patch }),
      ).toThrow();
  });
  it("increments revisions only for effective plan changes, ignoring a supplied revision", () => {
    const old = defaultCurriculum();
    expect(reviseCurriculum(old, { ...old, revision: 900 }).revision).toBe(1);
    expect(
      reviseCurriculum(old, { ...old, maxFactor: 10, revision: 900 }).revision,
    ).toBe(2);
    expect(
      reviseCurriculum(old, {
        ...old,
        enabledSkills: ["division", "multiplication"],
      }),
    ).toMatchObject({
      revision: 2,
      enabledSkills: ["multiplication", "division"],
    });
  });
  it("migrates legacy saves without losing coins, rewards, history or achievements", () => {
    const old = initialState();
    old.progress.addition.stars = 3;
    old.ledger.push({
      id: "earned",
      amount: 15,
      reason: "Practice",
      at: "old",
    });
    const legacy = structuredClone(old);
    delete (legacy.settings as Partial<typeof legacy.settings>).curriculum;
    const migrated = migrateState(legacy);
    expect(migrated.settings.curriculum).toEqual(defaultCurriculum());
    expect(balance(migrated)).toBe(15);
    expect(migrated.progress).toEqual(old.progress);
    expect(migrated.rewards).toEqual(old.rewards);
    expect(migrated.attempts).toEqual(old.attempts);
  });
  it("preserves an explicitly saved plan on future loads", () => {
    const s = initialState();
    s.settings.curriculum = fullPlan(9);
    expect(migrateState(s).settings.curriculum).toEqual(fullPlan(9));
  });
  it("rejects paused skills and permits parent-enabled skills", () => {
    expect(() => adventure(5, defaultCurriculum(), [], "addition")).toThrow(
      "paused",
    );
    expect(
      adventure(
        5,
        {
          ...defaultCurriculum(),
          enabledSkills: ["addition", "multiplication"],
        },
        [],
        "addition",
      ).questions,
    ).toHaveLength(10);
  });
});
describe("deterministic fact rotation", () => {
  it("produces exactly the same sequence for the same seed, plan and history", () => {
    expect(adventure(123, fullPlan())).toEqual(adventure(123, fullPlan()));
    expect(adventure(124, fullPlan()).questions.map(factKey)).not.toEqual(
      adventure(123, fullPlan()).questions.map(factKey),
    );
  });
  it("never repeats a fact family in ten questions, across all configured ranges and levels", () => {
    for (let max = 5; max <= 12; max++)
      for (const level of [1, 2, 3])
        for (const mode of ["adaptive", "full-range"] as const)
          for (let seed = 0; seed < 5; seed++) {
            const { questions } = adventure(
              seed,
              { ...fullPlan(max), mode },
              [],
              "multiplication",
              level,
            );
            expect(new Set(questions.map(factKey)).size).toBe(10);
            for (const q of questions) {
              expect(q.a).toBeGreaterThan(0);
              expect(q.b).toBeGreaterThan(0);
              expect(q.a).toBeLessThanOrEqual(max);
              expect(q.b).toBeLessThanOrEqual(max);
              expect(q.answer).toBe(q.a * q.b);
              expect(q.planRevision).toBe(1);
              expect(q.maxFactor).toBe(max);
            }
          }
  });
  it("covers every family through 12 × 12, including 11s and 12s, before over-practicing known facts", () => {
    let events: LearningEvent[] = [];
    const seen = new Set<string>();
    const sequence: string[] = [];
    for (let seed = 0; seed < 8; seed++) {
      const run = adventure(seed, fullPlan(), events);
      events = run.events;
      run.questions.forEach((q) => {
        seen.add(factKey(q));
        sequence.push(factKey(q));
      });
    }
    expect(seen.size).toBe(78);
    expect(new Set(sequence.slice(0, 78)).size).toBe(78);
    expect(seen.has("multiplication:12:12")).toBe(true);
    expect(seen.has("multiplication:11:12")).toBe(true);
  });
  it("keeps the last three families of a previous adventure out of the next opening question", () => {
    const first = adventure(71, fullPlan());
    const next = adventure(72, fullPlan(), first.events);
    expect(first.questions.slice(-3).map(factKey)).not.toContain(
      factKey(next.questions[0]),
    );
  });
  it("gives unseen facts priority on exploration turns", () => {
    const q = generateQuestion("multiplication", 3, 1, 0, {
      operands: [12, 12],
    });
    const run = adventure(123, fullPlan(), [event(q, "seen")]);
    expect(run.questions.slice(0, 2).map(factKey)).not.toContain(factKey(q));
  });
  it("revisits a tricky fact on a review turn only after a gap", () => {
    const tricky = generateQuestion("multiplication", 3, 1, 0, {
      operands: [12, 12],
    });
    let events = [event(tricky, "tricky", false)];
    for (let n = 1; n <= 3; n++) {
      const q = generateQuestion("multiplication", 3, n, 0, {
        operands: [n, n],
      });
      events.push(event(q, `filler-${n}`));
    }
    const run = adventure(123, fullPlan(), events);
    expect(factKey(run.questions[2])).toBe(factKey(tricky));
    expect(run.questions[2].selection).toBe("review");
    expect(
      run.questions.filter((q) => factKey(q) === factKey(tricky)),
    ).toHaveLength(1);
  });
  it("tracks hinted and unfinished wrong facts, and clears tricky status after two independent encounters", () => {
    const q = generateQuestion("multiplication", 3, 1, 0, {
      operands: [12, 12],
    });
    let events = [event(q, "hinted", true, "hint"), event(q, "hinted")];
    expect(factEvidence(events).facts.get(factKey(q))?.tricky).toBe(true);
    events.push(event(q, "independent-1"));
    expect(factEvidence(events).facts.get(factKey(q))?.tricky).toBe(true);
    events.push(event(q, "independent-2"));
    expect(factEvidence(events).facts.get(factKey(q))?.tricky).toBe(false);
    events.push(event(q, "unfinished", false));
    expect(factEvidence(events).facts.get(factKey(q))?.tricky).toBe(true);
  });
  it("also avoids exact repeats in division and addition/subtraction", () => {
    for (const skill of ["addition", "subtraction", "division"] as const)
      for (const level of [1, 2, 3]) {
        const plan = {
          ...defaultCurriculum(),
          enabledSkills: [skill],
          focusSkill: skill,
        };
        expect(
          new Set(adventure(123, plan, [], skill, level).questions.map(factKey))
            .size,
        ).toBe(10);
      }
  });
  it("freezes the plan snapshot for an adventure when the parent changes the saved range", () => {
    const old = fullPlan();
    const snapshot = structuredClone(old);
    const saved = reviseCurriculum(old, { ...old, maxFactor: 5 });
    expect(
      adventure(3, snapshot).questions.some((q) => q.a > 5 || q.b > 5),
    ).toBe(true);
    expect(
      adventure(3, saved).questions.every(
        (q) => q.a <= 5 && q.b <= 5 && q.planRevision === 2,
      ),
    ).toBe(true);
    expect(snapshot.maxFactor).toBe(12);
  });
  it("keeps question IDs distinct across adventures even if the seed is the same", () => {
    const input = {
      skill: "multiplication" as const,
      level: 1,
      seed: 1,
      index: 0,
      plan: defaultCurriculum(),
      events: [],
      asked: [],
    };
    expect(selectQuestion({ ...input, sessionId: "one" }).id).not.toBe(
      selectQuestion({ ...input, sessionId: "two" }).id,
    );
  });
  it("does not reset earning limits or achievements when a plan changes", () => {
    const state = initialState();
    state.settings.dailyCap = 3;
    const q = generateQuestion("multiplication", 1, 1, 0);
    const a: Attempt = {
      id: q.id,
      sessionId: "first",
      skill: "multiplication",
      level: 1,
      question: q,
      firstAnswer: String(q.answer),
      independent: true,
      hints: 0,
      wrongAnswers: 0,
      at: "2026-10-26T12:00:00.000Z",
      coins: 3,
    };
    state.attempts = [a];
    state.progress.multiplication = advance(
      initialProgress().multiplication,
      a,
    );
    const before = structuredClone(state.progress);
    state.settings.curriculum = reviseCurriculum(
      state.settings.curriculum,
      fullPlan(10),
    );
    expect(awardFor(state, { ...a, id: "next" })).toBe(0);
    expect(state.progress).toEqual(before);
  });
});
