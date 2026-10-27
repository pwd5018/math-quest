import { describe, expect, it } from "vitest";
import { initialState } from "./storage";
import { initialProgress, advance, type Attempt } from "./learning";
import { generateQuestion } from "./math";
import {
  awardFor,
  balance,
  requestReward,
  resolveRequest,
  adjustCoins,
} from "./economy";
const date = "2026-10-26T12:00:00.000Z";
function attempt(
  n = 0,
  independent = true,
  level = 1,
  sessionId = "session-1",
): Attempt {
  const q = generateQuestion("addition", level, n, n);
  return {
    id: q.id,
    sessionId,
    skill: "addition",
    level,
    question: q,
    firstAnswer: String(q.answer),
    independent,
    hints: independent ? 0 : 1,
    wrongAnswers: 0,
    at: date,
    coins: 0,
  };
}
describe("learning evidence", () => {
  it("starts at easy and advances after 3 independent answers", () => {
    let p = initialProgress().addition;
    expect(p.level).toBe(1);
    for (let i = 0; i < 3; i++) p = advance(p, attempt(i));
    expect(p.level).toBe(2);
    expect(p.stars).toBe(1);
  });
  it("does not advance on supported answers and preserves stars", () => {
    let p = { ...initialProgress().addition, stars: 2, streak: 2 };
    p = advance(p, attempt(0, false));
    expect(p.level).toBe(1);
    expect(p.streak).toBe(0);
    expect(p.stars).toBe(2);
  });
  it("mastery requires advanced evidence across 2 sessions", () => {
    let p = initialProgress().addition;
    for (let i = 0; i < 8; i++) p = advance(p, attempt(i, true, 3));
    expect(p.mastered).toBe(false);
    p = advance(p, attempt(9, true, 3, "session-2"));
    expect(p.mastered).toBe(true);
    expect(advance(p, attempt(10, false)).mastered).toBe(true);
  });
  it("never grants mastery for easy high accuracy", () => {
    let p = initialProgress().addition;
    for (let i = 0; i < 50; i++) p = advance(p, attempt(i, true, 1, `s-${i}`));
    expect(p.mastered).toBe(false);
    expect(p.stars).toBe(3);
  });
});
describe("coin issuance", () => {
  it("rewards independence and perseverance without penalties", () => {
    const s = initialState();
    expect(awardFor(s, attempt())).toBe(3);
    expect(awardFor(s, attempt(0, false))).toBe(1);
  });
  it("limits farming to 5 rewarded questions per skill/difficulty/day", () => {
    const s = initialState();
    for (let i = 0; i < 5; i++) s.attempts.push({ ...attempt(i), coins: 3 });
    expect(awardFor(s, attempt(6))).toBe(0);
    expect(awardFor(s, attempt(6, true, 2))).toBe(3);
    expect(awardFor(s, { ...attempt(6), at: "2026-10-27T00:00:00.000Z" })).toBe(
      3,
    );
  });
  it("caps daily earnings and rejects duplicate question awards", () => {
    const s = initialState();
    s.settings.dailyCap = 4;
    s.attempts.push({ ...attempt(), coins: 3 });
    expect(awardFor(s, attempt(1))).toBe(1);
    expect(awardFor(s, attempt())).toBe(0);
    s.settings.dailyCap = 0;
    expect(awardFor(s, attempt(2))).toBe(0);
  });
});
describe("atomic demo economy", () => {
  it("prevents safe-integer overflow in adjustments, awards and refunds", () => {
    let s = adjustCoins(
      initialState(),
      Number.MAX_SAFE_INTEGER,
      "Boundary test",
      "max",
      date,
    );
    expect(() => adjustCoins(s, 1, "Overflow", "extra", date)).toThrow();
    expect(awardFor(s, attempt())).toBe(0);
    s = requestReward(s, "movie", "r", date);
    s = adjustCoins(s, 30, "Boundary test", "topup", date);
    expect(() => resolveRequest(s, "r", "decline", date)).toThrow();
  });
  const funded = () =>
    adjustCoins(initialState(), 100, "Demo test award", "gift", date);
  it("starts at zero with seeded approved rewards", () => {
    const s = initialState();
    expect(balance(s)).toBe(0);
    expect(s.rewards).toHaveLength(3);
    expect(s.rewards.every((r) => r.approved)).toBe(true);
  });
  it("reserves cost, approves, then fulfills with no second debit", () => {
    let s = requestReward(funded(), "movie", "r1", date);
    expect(balance(s)).toBe(70);
    s = resolveRequest(s, "r1", "approve", date);
    s = resolveRequest(s, "r1", "fulfill", date);
    expect(balance(s)).toBe(70);
    expect(s.requests[0].status).toBe("fulfilled");
    expect(() => resolveRequest(s, "r1", "decline", date)).toThrow();
  });
  it("refunds pending and approved requests exactly once", () => {
    for (const approved of [false, true]) {
      let s = requestReward(funded(), "movie", "r1", date);
      if (approved) s = resolveRequest(s, "r1", "approve", date);
      s = resolveRequest(s, "r1", "decline", date);
      expect(balance(s)).toBe(100);
      expect(() => resolveRequest(s, "r1", "decline", date)).toThrow();
      expect(s.ledger.filter((e) => e.id === "refund-r1")).toHaveLength(1);
    }
  });
  it("is idempotent for duplicate request IDs", () => {
    const s = requestReward(funded(), "movie", "r1", date);
    expect(requestReward(s, "movie", "r1", date)).toBe(s);
  });
  it("rejects overspending, unavailable, archived and unapproved rewards", () => {
    expect(() => requestReward(initialState(), "movie", "r1", date)).toThrow();
    for (const field of ["archived", "approved", "available"] as const) {
      const s = funded();
      s.rewards[0][field] = field === "archived";
      expect(() => requestReward(s, "movie", "r1", date)).toThrow();
    }
  });
  it("enforces quantity/repeat limits and restores capacity after refund", () => {
    let s = requestReward(funded(), "picnic", "r1", date);
    expect(() => requestReward(s, "picnic", "r2", date)).toThrow();
    s = resolveRequest(s, "r1", "decline", date);
    expect(requestReward(s, "picnic", "r2", date).requests).toHaveLength(2);
  });
  it("retains original price when inventory changes after request", () => {
    let s = requestReward(funded(), "movie", "r1", date);
    s.rewards[0].cost = 90;
    s = resolveRequest(s, "r1", "decline", date);
    expect(balance(s)).toBe(100);
  });
  it("requires a reason and forbids negative or fractional balances", () => {
    for (const [n, reason] of [
      [-101, "Test"],
      [1.2, "Test"],
      [1, ""],
      [0, "Test"],
    ] as const)
      expect(() => adjustCoins(funded(), n, reason, "id", date)).toThrow();
  });
  it("keeps a nonnegative ledger across repeated request/refund cycles", () => {
    let s = funded();
    for (let i = 0; i < 40; i++) {
      s = requestReward(s, "movie", `r${i}`, date);
      expect(balance(s)).toBeGreaterThanOrEqual(0);
      s = resolveRequest(s, `r${i}`, "decline", date);
    }
    expect(balance(s)).toBe(100);
    expect(s.progress).toEqual(initialProgress());
  });
});
