export type Subject = "multiplication" | "division";
export type Model =
  | "groups"
  | "addition"
  | "jumps"
  | "array"
  | "sharing"
  | "packing"
  | "equation"
  | "division-array";
export type Example = { groups: number; each: number };
export type Lesson = {
  id: string;
  subject: Subject;
  title: string;
  description: string;
  model: Model;
  example: Example;
  checks: [Example, Example];
  explanation: string;
  guided: string;
  takeaway: string;
};
export const lessons: Lesson[] = [
  {
    id: "equal-groups",
    subject: "multiplication",
    title: "Equal groups",
    model: "groups",
    description: "Discover what makes a group equal.",
    example: { groups: 3, each: 4 },
    checks: [
      { groups: 2, each: 3 },
      { groups: 4, each: 2 },
    ],
    explanation:
      "Equal groups have the same amount in every group. Three groups of four berries make twelve altogether.",
    guided:
      "Put four berries on each of three blankets. Tap a berry to take it back. The total alone is not enough: every group must be equal.",
    takeaway:
      "Multiplication counts equal groups: number of groups × number in each = total.",
  },
  {
    id: "repeated-addition",
    subject: "multiplication",
    title: "Repeated addition",
    model: "addition",
    description: "Turn equal groups into an addition sentence.",
    example: { groups: 3, each: 4 },
    checks: [
      { groups: 3, each: 2 },
      { groups: 2, each: 5 },
    ],
    explanation:
      "Each group contributes the same addend. Three groups of four are 4 + 4 + 4. That is another way to write 3 × 4.",
    guided:
      "Look at the three groups of four. Choose the number contributed by each group to complete the addition sentence.",
    takeaway:
      "In repeated addition, each addend is the amount in one group. The number of addends tells us how many groups.",
  },
  {
    id: "skip-counting",
    subject: "multiplication",
    title: "Skip-counting",
    model: "jumps",
    description: "Count groups using equal jumps.",
    example: { groups: 3, each: 4 },
    checks: [
      { groups: 4, each: 3 },
      { groups: 3, each: 5 },
    ],
    explanation:
      "Start at zero. Jump four for each group: 4, 8, 12. Three jumps of four land on twelve. Count the jumps as well as the landing numbers.",
    guided:
      "Start at zero. Make three jumps of four. Tap the number where the next jump should land. You can undo a jump.",
    takeaway:
      "Equal jumps connect skip-counting to multiplication. Three jumps of four show 3 × 4.",
  },
  {
    id: "multiplication-arrays",
    subject: "multiplication",
    title: "Rows and columns",
    model: "array",
    description: "Organize equal groups into an array.",
    example: { groups: 3, each: 4 },
    checks: [
      { groups: 2, each: 4 },
      { groups: 4, each: 3 },
    ],
    explanation:
      "An array has equal rows. Three rows with four berries in every row have twelve berries. Rows go across; columns go down.",
    guided:
      "Build three rows with four columns. Each row is one equal group. Changing a row or column changes the total.",
    takeaway:
      "Rows × columns gives the total in an array. Label the rows and columns to explain your thinking.",
  },
  {
    id: "equal-sharing",
    subject: "division",
    title: "Share equally",
    model: "sharing",
    description: "Find how many belong in each group.",
    example: { groups: 3, each: 4 },
    checks: [
      { groups: 2, each: 4 },
      { groups: 3, each: 5 },
    ],
    explanation:
      "We know the total and the number of groups. Share twelve berries among three blankets. Each blanket gets four. Here the answer tells us how many are in each group.",
    guided:
      "Share all twelve berries among three blankets. Use the whole basket and make every blanket equal. Tap a berry to return it.",
    takeaway:
      "Total ÷ number of groups = amount in each group. Ask: how many does each group get?",
  },
  {
    id: "make-groups",
    subject: "division",
    title: "Make equal-sized groups",
    model: "packing",
    description: "Find how many groups you can make.",
    example: { groups: 3, each: 4 },
    checks: [
      { groups: 4, each: 3 },
      { groups: 3, each: 5 },
    ],
    explanation:
      "We know the total and the size of each group. Pack twelve berries, four to a basket. You can fill three baskets. Here the answer tells us how many groups we made.",
    guided:
      "Pack twelve berries with four in every basket. Add or remove baskets, and fill each one. No berries should be left over.",
    takeaway:
      "Total ÷ amount in each group = number of groups. Ask: how many full groups can I make?",
  },
  {
    id: "division-equations",
    subject: "division",
    title: "From sharing to equations",
    model: "equation",
    description: "Connect the total, groups and amount in each.",
    example: { groups: 3, each: 4 },
    checks: [
      { groups: 4, each: 2 },
      { groups: 2, each: 6 },
    ],
    explanation:
      "In this sharing story, twelve is the total, three is the number of groups, and four is the amount in each group. That gives 12 ÷ 3 = 4.",
    guided:
      "Read the picture, then label its total, number of groups, and berries in each group. Use those quantities to build the sharing equation.",
    takeaway:
      "An equation describes a story. Label what each number means, rather than choosing numbers just because they appear in the picture.",
  },
  {
    id: "division-arrays",
    subject: "division",
    title: "Divide with arrays",
    model: "division-array",
    description: "Use rows to find the missing amount.",
    example: { groups: 3, each: 4 },
    checks: [
      { groups: 4, each: 5 },
      { groups: 2, each: 6 },
    ],
    explanation:
      "Arrange twelve berries into three equal rows. Every row has four. The array shows 12 ÷ 3 = 4 and helps check it with 3 × 4 = 12.",
    guided:
      "Arrange all twelve berries in three equal rows. Add berries to the rows and return extras. Find how many belong in each row.",
    takeaway:
      "An array can show division as a missing amount in each row. Check: number of rows × berries per row = total.",
  },
];
export function lessonById(id: string) {
  return lessons.find((l) => l.id === id);
}
export function answerFor(lesson: Lesson, example: Example) {
  return lesson.subject === "multiplication"
    ? example.groups * example.each
    : lesson.model === "packing"
      ? example.groups
      : example.each;
}
export function equationFor(lesson: Lesson, example: Example) {
  return lesson.subject === "multiplication"
    ? `${example.groups} × ${example.each}`
    : `${example.groups * example.each} ÷ ${lesson.model === "packing" ? example.each : example.groups}`;
}
export function questionFor(lesson: Lesson, example: Example) {
  const { groups, each } = example,
    total = groups * each;
  if (lesson.subject === "division")
    return lesson.model === "packing"
      ? `Pack ${total} berries with ${each} in each basket. How many full baskets can you make?`
      : lesson.model === "division-array"
        ? `Arrange ${total} berries in ${groups} equal rows. How many berries go in each row?`
        : `Share ${total} berries equally among ${groups} blankets. How many berries does each blanket get?`;
  return lesson.model === "jumps"
    ? `Make ${groups} equal jumps of ${each}, starting at zero. Where will you land?`
    : lesson.model === "array"
      ? `An array has ${groups} rows and ${each} columns. How many berries are there?`
      : `${groups} equal groups have ${each} berries in each. How many berries altogether?`;
}
export type ModelState = {
  counts: number[];
  terms: number[];
  jumps: number[];
  rows: number;
  columns: number;
  roles: number[];
};
export function initialModel(lesson: Lesson): ModelState {
  return {
    counts: Array(lesson.model === "packing" ? 1 : lesson.example.groups).fill(
      0,
    ),
    terms: Array(lesson.example.groups).fill(0),
    jumps: [0],
    rows: 1,
    columns: 1,
    roles: [0, 0, 0],
  };
}
export function gradeModel(
  lesson: Lesson,
  state: ModelState,
): { correct: boolean; message: string } {
  const { groups, each } = lesson.example,
    total = groups * each;
  if (lesson.model === "addition") {
    const correct =
      state.terms.length === groups && state.terms.every((n) => n === each);
    return {
      correct,
      message: correct
        ? `${state.terms.join(" + ")} = ${total}. Each group contributes ${each}.`
        : `Each pictured group contains ${each} berries. Use ${each} for each addend; we need ${groups} addends.`,
    };
  }
  if (lesson.model === "jumps") {
    const correct =
      state.jumps.length === groups + 1 &&
      state.jumps.every((n, i) => n === i * each);
    return {
      correct,
      message: correct
        ? `${groups} equal jumps of ${each} land on ${total}.`
        : `Start at zero and make ${groups} jumps of ${each}. Count the jumps, not just the final number.`,
    };
  }
  if (lesson.model === "array") {
    const correct = state.rows === groups && state.columns === each;
    return {
      correct,
      message: correct
        ? `${groups} rows × ${each} columns = ${total} berries.`
        : `We need ${groups} rows across and ${each} columns down. Your array has ${state.rows} rows and ${state.columns} columns.`,
    };
  }
  if (lesson.model === "equation") {
    const expected = [total, groups, each],
      labels = ["total berries", "number of groups", "berries in each group"];
    const index = expected.findIndex((n, i) => state.roles[i] !== n);
    return {
      correct: index < 0,
      message:
        index < 0
          ? `${total} ÷ ${groups} = ${each}. Every number has a job in this sharing story.`
          : `Look again at the ${labels[index]}. ${index === 0 ? "Count all the berries, not just one group." : index === 1 ? "Count the blankets, not the berries." : "Count the berries on one blanket."}`,
    };
  }
  if (state.counts.length !== groups)
    return {
      correct: false,
      message: `Each basket holds ${each}. Try making ${groups} baskets to fit all ${total} berries.`,
    };
  const index = state.counts.findIndex((n) => n !== each);
  if (index >= 0)
    return {
      correct: false,
      message: `${lesson.model === "packing" ? "Basket" : lesson.model === "division-array" ? "Row" : "Blanket"} ${index + 1} has ${state.counts[index]} berries. ${lesson.subject === "multiplication" ? `Make it ${each}. Every group needs ${each}.` : "Use all the berries and make every group equal. You can return a berry by tapping it."}`,
    };
  return {
    correct: true,
    message:
      lesson.model === "packing"
        ? `${total} berries fill ${groups} baskets with ${each} in each. The answer is ${groups} baskets!`
        : `Every ${lesson.model === "division-array" ? "row" : "blanket"} has ${each} berries. ${equationFor(lesson, lesson.example)} = ${answerFor(lesson, lesson.example)}.`,
  };
}
export type LessonObservation = {
  explored: number;
  supported: number;
  independent: number;
};
export type LessonJournal = Record<string, LessonObservation>;
export function restoreJournal(raw: unknown): LessonJournal {
  const result: LessonJournal = {};
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return result;
  const count = (n: unknown) =>
    typeof n === "number" && Number.isSafeInteger(n) && n >= 0
      ? Math.min(9999, n)
      : 0;
  for (const lesson of lessons) {
    const value = (raw as Record<string, unknown>)[lesson.id];
    if (value && typeof value === "object") {
      const n = value as LessonObservation;
      result[lesson.id] = {
        explored: count(n.explored),
        supported: count(n.supported),
        independent: count(n.independent),
      };
    }
  }
  return result;
}
export function observeLesson(
  journal: LessonJournal,
  id: string,
  kind: keyof LessonObservation,
): LessonJournal {
  if (!lessonById(id)) return journal;
  const previous = journal[id] ?? { explored: 0, supported: 0, independent: 0 };
  return {
    ...journal,
    [id]: { ...previous, [kind]: Math.min(9999, previous[kind] + 1) },
  };
}
