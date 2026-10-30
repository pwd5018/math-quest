export type ConceptNote = {
  visits: number;
  completed: number;
  multiplication: "not-tried" | "with-help" | "independent";
  sharing: "not-tried" | "with-help" | "independent";
};
export const emptyConceptNote = (): ConceptNote => ({
  visits: 0,
  completed: 0,
  multiplication: "not-tried",
  sharing: "not-tried",
});
/** Device-only observations, deliberately outside wallet, mastery and Firebase state. */
export function restoreConceptNote(raw: unknown): ConceptNote {
  const note = raw as Partial<ConceptNote> | null;
  if (!note || typeof note !== "object") return emptyConceptNote();
  const count = (n: unknown) =>
    typeof n === "number" && Number.isSafeInteger(n) && n >= 0
      ? Math.min(n, 9999)
      : 0;
  const status = (s: unknown): ConceptNote["sharing"] =>
    s === "independent" || s === "with-help" ? s : "not-tried";
  return {
    visits: count(note.visits),
    completed: count(note.completed),
    multiplication: status(note.multiplication),
    sharing: status(note.sharing),
  };
}
export function checkGroups(
  counts: number[],
  groups: number,
  each: number,
): { correct: boolean; message: string } {
  if (
    counts.length !== groups ||
    counts.some((n) => !Number.isInteger(n) || n < 0 || n > 12)
  )
    return {
      correct: false,
      message: "Let’s reset the blankets and try together.",
    };
  const index = counts.findIndex((n) => n !== each);
  if (index < 0)
    return {
      correct: true,
      message: `Every blanket has ${each}. ${groups} equal groups of ${each} make ${groups * each}!`,
    };
  const count = counts[index],
    difference = Math.abs(each - count);
  return {
    correct: false,
    message: `Blanket ${index + 1} has ${count} berries. ${count < each ? `Add ${difference} more` : `Take away ${difference}`} to make ${each}. Every blanket needs ${each}.`,
  };
}
export function recordConceptCheck(
  note: ConceptNote,
  key: "multiplication" | "sharing",
  assisted: boolean,
): ConceptNote {
  // A later supported attempt must not erase a previously observed independent check.
  return {
    ...note,
    [key]:
      note[key] === "independent" || !assisted ? "independent" : "with-help",
  };
}
export const independentChecks = [
  {
    groups: 2,
    each: 3,
    prompt: "Two blankets. Three berries on each. How many berries altogether?",
  },
  {
    groups: 4,
    each: 2,
    prompt: "Four blankets. Two berries on each. How many berries altogether?",
  },
] as const;
