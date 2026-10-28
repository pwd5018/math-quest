import type { Attempt, Progress } from "./learning";
import type { Curriculum } from "./curriculum";
import type { Appearance } from "./appearance";
export type Reward = {
  id: string;
  title: string;
  description: string;
  cost: number;
  emoji: string;
  approved: boolean;
  archived: boolean;
  limit: number;
  available: boolean;
  /** Cloud inventory usage, maintained only by validated request/refund transactions. */
  used?: number;
};
export type Request = {
  id: string;
  rewardId: string;
  title: string;
  cost: number;
  status: "pending" | "approved" | "declined" | "fulfilled";
  at: string;
};
export type LedgerEntry = {
  id: string;
  amount: number;
  reason: string;
  at: string;
  reference?: string;
};
export type Session = {
  id: string;
  skill: string;
  at: string;
  independent: number;
  coins: number;
  plan?: Curriculum;
  seed?: number;
};
export type LearningEvent = {
  questionId: string;
  sessionId: string;
  question: { a: number; b: number; symbol: string; skill: string };
  kind: "answer" | "hint";
  answer?: string;
  correct?: boolean;
  at: string;
};
export type State = {
  appearance: Appearance;
  version: 1;
  nickname: string;
  attempts: Attempt[];
  events: LearningEvent[];
  progress: Progress;
  rewards: Reward[];
  requests: Request[];
  ledger: LedgerEntry[];
  sessions: Session[];
  settings: {
    dailyCap: number;
    weeklySessions: number;
    curriculum: Curriculum;
  };
  goalId: string | null;
};
export const balance = (state: State) =>
  state.ledger.reduce((sum, e) => sum + e.amount, 0);
export function awardFor(state: State, attempt: Attempt): number {
  if (state.attempts.some((a) => a.id === attempt.id)) return 0;
  const day = attempt.at.slice(0, 10);
  const today = state.attempts.filter((a) => a.at.slice(0, 10) === day);
  const bucket = today.filter(
    (a) =>
      a.skill === attempt.skill && a.level === attempt.level && a.coins > 0,
  ).length;
  const earned = today.reduce((n, a) => n + a.coins, 0);
  return bucket >= 5
    ? 0
    : Math.max(
        0,
        Math.min(
          attempt.independent ? 3 : 1,
          state.settings.dailyCap - earned,
          Number.MAX_SAFE_INTEGER - balance(state),
        ),
      );
}
export function requestReward(
  state: State,
  rewardId: string,
  id: string,
  at: string,
): State {
  const reward = state.rewards.find((r) => r.id === rewardId);
  if (state.requests.some((r) => r.id === id)) return state;
  if (
    !reward ||
    !reward.approved ||
    reward.archived ||
    !reward.available ||
    !Number.isSafeInteger(reward.cost) ||
    reward.cost < 1
  )
    throw new Error("This treasure is not available.");
  const used = state.requests.filter(
    (r) => r.rewardId === rewardId && r.status !== "declined",
  ).length;
  if (reward.limit > 0 && used >= reward.limit)
    throw new Error("This treasure has reached its request limit.");
  if (balance(state) < reward.cost)
    throw new Error("Keep exploring to save enough coins.");
  return {
    ...state,
    requests: [
      ...state.requests,
      {
        id,
        rewardId,
        title: reward.title,
        cost: reward.cost,
        status: "pending",
        at,
      },
    ],
    ledger: [
      ...state.ledger,
      {
        id: `spend-${id}`,
        amount: -reward.cost,
        reason: `Requested: ${reward.title}`,
        at,
        reference: id,
      },
    ],
  };
}
export function resolveRequest(
  state: State,
  id: string,
  action: "approve" | "decline" | "fulfill",
  at: string,
): State {
  const request = state.requests.find((r) => r.id === id);
  if (!request) throw new Error("Request not found.");
  const allowed =
    action === "approve"
      ? request.status === "pending"
      : action === "fulfill"
        ? request.status === "approved"
        : request.status === "pending" || request.status === "approved";
  if (!allowed)
    throw new Error("This request has already moved to another status.");
  if (
    action === "decline" &&
    !Number.isSafeInteger(balance(state) + request.cost)
  )
    throw new Error(
      "Adjust the wallet before refunding this request: the safe balance limit would be exceeded.",
    );
  return {
    ...state,
    requests: state.requests.map((r) =>
      r.id === id
        ? {
            ...r,
            status:
              action === "approve"
                ? "approved"
                : action === "fulfill"
                  ? "fulfilled"
                  : "declined",
          }
        : r,
    ),
    ledger:
      action === "decline"
        ? [
            ...state.ledger,
            {
              id: `refund-${id}`,
              amount: request.cost,
              reason: `Refund: ${request.title}`,
              reference: id,
              at,
            },
          ]
        : state.ledger,
  };
}
export function adjustCoins(
  state: State,
  amount: number,
  reason: string,
  id: string,
  at: string,
): State {
  if (!Number.isSafeInteger(amount) || amount === 0 || !reason.trim())
    throw new Error("Enter a whole coin amount and a reason.");
  if (balance(state) + amount < 0)
    throw new Error("An adjustment cannot make the balance negative.");
  if (!Number.isSafeInteger(balance(state) + amount))
    throw new Error("The safe coin balance limit would be exceeded.");
  return {
    ...state,
    ledger: [...state.ledger, { id, amount, reason: reason.trim(), at }],
  };
}
