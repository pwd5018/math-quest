import {
  generateQuestion,
  random,
  skills,
  type Question,
  type Skill,
} from "./math";
import type { LearningEvent, State } from "./economy";
import { restoreAppearance } from "./appearance";

export type Curriculum = {
  revision: number;
  focusSkill: Skill;
  enabledSkills: Skill[];
  maxFactor: number;
  mode: "adaptive" | "full-range";
};
export const defaultCurriculum = (): Curriculum => ({
  revision: 1,
  focusSkill: "multiplication",
  enabledSkills: ["multiplication"],
  maxFactor: 12,
  mode: "adaptive",
});
export function validateCurriculum(value: unknown): Curriculum {
  if (!value || typeof value !== "object")
    throw new Error("Choose a valid learning plan.");
  const p = value as Curriculum;
  if (
    !Array.isArray(p.enabledSkills) ||
    !p.enabledSkills.length ||
    p.enabledSkills.some((s) => !skills.includes(s)) ||
    new Set(p.enabledSkills).size !== p.enabledSkills.length ||
    !p.enabledSkills.includes(p.focusSkill)
  )
    throw new Error("Enable at least one skill and choose an enabled focus.");
  if (!Number.isInteger(p.maxFactor) || p.maxFactor < 5 || p.maxFactor > 12)
    throw new Error("Choose a multiplication limit from 5 to 12.");
  if (!["adaptive", "full-range"].includes(p.mode))
    throw new Error("Choose gentle progression or the full fact range.");
  if (!Number.isSafeInteger(p.revision) || p.revision < 1)
    throw new Error("Invalid learning plan revision.");
  return {
    revision: p.revision,
    focusSkill: p.focusSkill,
    maxFactor: p.maxFactor,
    mode: p.mode,
    enabledSkills: skills.filter((s) => p.enabledSkills.includes(s)),
  };
}
export function reviseCurriculum(
  current: Curriculum,
  draft: unknown,
): Curriculum {
  const next = validateCurriculum({
    ...(draft as Curriculum),
    revision: current.revision,
  });
  const changed =
    next.focusSkill !== current.focusSkill ||
    next.maxFactor !== current.maxFactor ||
    next.mode !== current.mode ||
    next.enabledSkills.join() !== current.enabledSkills.join();
  return { ...next, revision: current.revision + Number(changed) };
}
// Pure migration preserves achievements, requests, balances, and any existing parent plan.
export function migrateState(state: State): State {
  return {
    ...state,
    appearance: restoreAppearance(state.appearance),
    events: Array.isArray(state.events) ? state.events : [],
    settings: {
      ...state.settings,
      curriculum: state.settings.curriculum
        ? validateCurriculum(state.settings.curriculum)
        : defaultCurriculum(),
    },
  };
}
export function factKey(q: Pick<Question, "skill" | "a" | "b">): string {
  return q.skill === "multiplication" || q.skill === "addition"
    ? `${q.skill}:${Math.min(q.a, q.b)}:${Math.max(q.a, q.b)}`
    : `${q.skill}:${q.a}:${q.b}`;
}
export type FactEvidence = {
  count: number;
  independentStreak: number;
  tricky: boolean;
  last: number;
};
export function factEvidence(events: LearningEvent[]): {
  facts: Map<string, FactEvidence>;
  total: number;
} {
  const grouped = new Map<
    string,
    { key: string; supported: boolean; correct: boolean }
  >();
  for (const e of events) {
    const key = factKey(e.question as Pick<Question, "skill" | "a" | "b">);
    const group = grouped.get(e.questionId) ?? {
      key,
      supported: false,
      correct: false,
    };
    group.supported ||= e.kind === "hint" || e.correct === false;
    group.correct ||= e.kind === "answer" && e.correct === true;
    grouped.set(e.questionId, group);
  }
  const facts = new Map<string, FactEvidence>();
  let index = 0;
  for (const g of grouped.values()) {
    const old = facts.get(g.key) ?? {
      count: 0,
      independentStreak: 0,
      tricky: false,
      last: -100,
    };
    const streak = g.correct && !g.supported ? old.independentStreak + 1 : 0;
    facts.set(g.key, {
      count: old.count + 1,
      independentStreak: streak,
      tricky: g.supported || (old.tricky && streak < 2),
      last: index++,
    });
  }
  return { facts, total: index };
}
export function selectQuestion({
  skill,
  level,
  seed,
  index,
  sessionId,
  plan,
  events,
  asked,
  history,
}: {
  skill: Skill;
  level: number;
  seed: number;
  index: number;
  sessionId: string;
  plan: Curriculum;
  events: LearningEvent[];
  asked: Question[];
  history?: { facts: Map<string, FactEvidence>; total: number };
}): Question {
  if (!plan.enabledSkills.includes(skill))
    throw new Error("This trail is paused in the parent learning plan.");
  const effectiveLevel =
    skill === "multiplication" && plan.mode === "full-range" ? 3 : level;
  const candidates = new Map<string, Question>();
  if (skill === "multiplication" || skill === "division") {
    const max = skill === "multiplication" ? plan.maxFactor : 10;
    const rows = Math.min(max, [3, 5, max][effectiveLevel - 1]);
    const cols = Math.min(max, [5, max, max][effectiveLevel - 1]);
    for (let a = 1; a <= rows; a++)
      for (let b = 1; b <= cols; b++) {
        const q = generateQuestion(skill, effectiveLevel, seed, index, {
          maxFactor: max,
          operands: skill === "multiplication" ? [a, b] : [a * b, a],
        });
        candidates.set(factKey(q), q);
      }
  } else {
    for (let i = 0; i < 400; i++) {
      const q = generateQuestion(
        skill,
        effectiveLevel,
        seed + i * 104729,
        index,
      );
      candidates.set(factKey(q), q);
    }
  }
  const seen = new Set(asked.map(factKey));
  const { facts, total } =
    history ?? factEvidence(events.filter((e) => e.question.skill === skill));
  const rng = random(seed + index * 7919);
  const pool = [...candidates]
    .filter(([key]) => !seen.has(key))
    .map(([key, q]) => ({ key, q, evidence: facts.get(key), tie: rng() }));
  if (!pool.length)
    throw new Error("This trail has no new facts left for this adventure.");
  // Exclude the previous three facts when possible. Review becomes eligible after three intervening questions.
  const rested = pool.filter(
    (c) => !c.evidence || total - 1 - c.evidence.last >= 3,
  );
  const eligible = rested.length ? rested : pool;
  const reviews =
    index % 3 === 2 ? eligible.filter((c) => c.evidence?.tricky) : [];
  const review = reviews.length > 0;
  const selected = (review ? reviews : eligible).sort(
    (a, b) =>
      (a.evidence?.count ?? 0) - (b.evidence?.count ?? 0) ||
      (a.evidence?.last ?? -1) - (b.evidence?.last ?? -1) ||
      a.tie - b.tie,
  )[0];
  let question = selected.q;
  if (skill === "multiplication" && rng() < 0.5) {
    const rows = Math.min(
      plan.maxFactor,
      [3, 5, plan.maxFactor][effectiveLevel - 1],
    );
    if (question.b <= rows)
      question = generateQuestion(skill, effectiveLevel, seed, index, {
        maxFactor: plan.maxFactor,
        operands: [question.b, question.a],
      });
  }
  return {
    ...question,
    id: `${sessionId}-${index}`,
    planRevision: plan.revision,
    ...(skill === "multiplication" ? { maxFactor: plan.maxFactor } : {}),
    selection: review ? "review" : "explore",
  };
}
