export type Skill = "addition" | "subtraction" | "multiplication" | "division";
export const skills: Skill[] = [
  "addition",
  "subtraction",
  "multiplication",
  "division",
];
export const skillNames: Record<Skill, string> = {
  addition: "Addition",
  subtraction: "Subtraction",
  multiplication: "Multiplication",
  division: "Division",
};
export type Question = {
  id: string;
  skill: Skill;
  level: number;
  a: number;
  b: number;
  answer: number;
  symbol: string;
  story?: string;
  hint: string;
  explanation: string;
  planRevision?: number;
  maxFactor?: number;
  selection?: "review" | "explore";
};
export function random(seed: number) {
  let x = seed >>> 0;
  return () => {
    x = (Math.imul(1664525, x) + 1013904223) >>> 0;
    return x / 4294967296;
  };
}
export function generateQuestion(
  skill: Skill,
  level: number,
  seed: number,
  index: number,
  options: { maxFactor?: number; operands?: [number, number] } = {},
): Question {
  level = Math.max(1, Math.min(3, Math.floor(level)));
  const rng = random(seed + index * 7919);
  const int = (min: number, max: number) =>
    min + Math.floor(rng() * (max - min + 1));
  let a: number,
    b: number,
    answer: number,
    symbol: string,
    hint: string,
    explanation: string;
  if (skill === "addition") {
    const max = [20, 100, 1000][level - 1];
    a = int(1, max - 1);
    b = int(1, max - a);
    answer = a + b;
    symbol = "+";
    hint = `Start at ${a}. Move ${b} steps forward. Try breaking ${b} into tens and ones.`;
    explanation = `${a} + ${b} = ${answer}. ${b >= 10 ? `Add ${Math.floor(b / 10) * 10} first, then ${b % 10}: ${a} → ${a + Math.floor(b / 10) * 10} → ${answer}.` : `Count on ${b} from ${a} to reach ${answer}.`}`;
  } else if (skill === "subtraction") {
    a = int(2, [20, 100, 1000][level - 1]);
    b = int(1, a);
    answer = a - b;
    symbol = "−";
    hint = `Start at ${a} and hop back ${b}. You can also ask: ${b} plus what makes ${a}?`;
    explanation = `${a} − ${b} = ${answer}. Check it by adding: ${b} + ${answer} = ${a}.`;
  } else if (skill === "multiplication") {
    const max = options.maxFactor ?? 12;
    a = options.operands?.[0] ?? int(1, Math.min(max, [3, 5, max][level - 1]));
    b =
      options.operands?.[1] ?? int(1, Math.min(max, [5, max, max][level - 1]));
    answer = a * b;
    symbol = "×";
    hint = `Picture ${a} equal groups with ${b} in each. Skip-count by ${b}, ${a} times.`;
    explanation = `${a} × ${b} = ${answer}. ${Array.from({ length: a }, () => b).join(" + ")} = ${answer}.`;
  } else {
    b = options.operands?.[1] ?? int(1, [3, 5, 10][level - 1]);
    answer = options.operands
      ? options.operands[0] / b
      : int(1, [5, 10, 10][level - 1]);
    a = b * answer;
    symbol = "÷";
    hint = `Share ${a} into ${b} equal groups. Think: ${b} times what equals ${a}?`;
    explanation = `${a} ÷ ${b} = ${answer}. Each group gets ${answer}. Check: ${b} × ${answer} = ${a}.`;
  }
  const stories: Record<Skill, string> = {
    addition: `Pip found ${a} glowing pebbles, then ${b} more. How many pebbles does Pip have?`,
    subtraction: `There are ${a} berries in a basket. Pip shares ${b} with friends. How many berries are left?`,
    multiplication: `There are ${a} treasure bags with ${b} gems in each. How many gems are there altogether?`,
    division: `Pip shares ${a} gems equally among ${b} adventurers. How many gems does each adventurer get?`,
  };
  return {
    id: `${seed}-${index}-${skill}-${level}`,
    skill,
    level,
    a,
    b,
    answer,
    symbol,
    hint,
    explanation,
    ...(index % 3 === 2 ? { story: stories[skill] } : {}),
  };
}
export function checkAnswer(question: Question, input: string): boolean {
  return /^\d+$/.test(input.trim()) && Number(input.trim()) === question.answer;
}
