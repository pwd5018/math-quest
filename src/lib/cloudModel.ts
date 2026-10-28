import { initialState } from "./storage";
import { advance, type SkillProgress } from "./learning";
import { type Question, type Skill } from "./math";
import type { Curriculum } from "./curriculum";
import type { State } from "./economy";

export const CHILD_ID = "explorer";
export const HISTORY_PAGE = 100;
export const MAX_BALANCE = 1_000_000_000;
export const bucketKeys = [
  "addition",
  "subtraction",
  "multiplication",
  "division",
].flatMap((s) => [1, 2, 3].map((l) => `${s}-${l}`));
export const emptyBuckets = () =>
  Object.fromEntries(bucketKeys.map((k) => [k, 0]));
export type Wallet = {
  balance: number;
  total: number;
  day: number;
  earned: number;
  counts: Record<string, number>;
  lastOp: string;
};
export const emptyWallet = (): Wallet => ({
  balance: 0,
  total: 0,
  day: 0,
  earned: 0,
  counts: emptyBuckets(),
  lastOp: "",
});
export type CloudSession = {
  id: string;
  skill: Skill;
  seed: number;
  index: number;
  question: Question;
  plan: Curriculum;
  asked: string[];
  hints: number;
  wrongs: number;
  first: string;
  answered: boolean;
  finished: boolean;
  independent: number;
  coins: number;
  action: string;
  eventId: string;
};
export function cloudAward(
  wallet: Wallet,
  skill: Skill,
  level: number,
  independent: boolean,
  cap: number,
  day: number,
) {
  const earned = wallet.day === day ? wallet.earned : 0;
  const count =
    wallet.day === day ? (wallet.counts[`${skill}-${level}`] ?? 0) : 0;
  return count >= 5
    ? 0
    : Math.max(
        0,
        Math.min(
          independent ? 3 : 1,
          cap - earned,
          MAX_BALANCE - wallet.balance,
        ),
      );
}
export function cloudProgress(
  old: SkillProgress,
  independent: boolean,
  level: number,
  sessionId: string,
): SkillProgress {
  const next = advance(old, { independent, level, sessionId } as Parameters<
    typeof advance
  >[1]);
  return { ...next, advancedSessions: next.advancedSessions.slice(0, 2) };
}
export function blankCloudState(): State {
  return { ...initialState(), rewards: [], goalId: null };
}
export const utcDay = (milliseconds: number) =>
  Math.floor(milliseconds / 86400000);
export function questionKey(q: Pick<Question, "skill" | "a" | "b">) {
  return q.skill === "addition" || q.skill === "multiplication"
    ? `${q.skill}-${Math.min(q.a, q.b)}-${Math.max(q.a, q.b)}`
    : `${q.skill}-${q.a}-${q.b}`;
}
