import type { Question } from "./math";
import type { Attempt } from "./learning";

export function numberHop(q: Question, moved: number, size: number) {
  const distance = Math.min(Math.max(0, q.b - moved), size);
  return {
    moved: moved + distance,
    position: q.a + (q.skill === "subtraction" ? -1 : 1) * (moved + distance),
    distance,
  };
}

export function adventureHighlights(attempts: Attempt[], sessionId: string) {
  const current = [
    ...new Map(
      attempts.filter((a) => a.sessionId === sessionId).map((a) => [a.id, a]),
    ).values(),
  ];
  return {
    reviewed: current.filter(
      (a) => a.independent && a.question.selection === "review",
    ).length,
    supported: current.filter((a) => !a.independent).length,
    retried: current.filter((a) => a.wrongAnswers > 0).length,
    discoveries: current
      .filter((a) => a.independent)
      .slice(-3)
      .map((a) => a.question),
  };
}
