import { describe, it, expect } from "vitest";
import {
  cloudAward,
  cloudProgress,
  emptyWallet,
  utcDay,
  questionKey,
} from "./cloudModel";
import { initialProgress } from "./learning";
describe("cloud earning calculations", () => {
  it("resets daily counters by UTC day but keeps permanent wallet balance", () => {
    const w = {
      ...emptyWallet(),
      balance: 30,
      earned: 40,
      day: 100,
      counts: { ...emptyWallet().counts, "multiplication-1": 5 },
    };
    expect(cloudAward(w, "multiplication", 1, true, 40, 100)).toBe(0);
    expect(cloudAward(w, "multiplication", 1, true, 40, 101)).toBe(3);
    expect(utcDay(Date.parse("2026-10-27T23:59:59Z")) + 1).toBe(
      utcDay(Date.parse("2026-10-28T00:00:00Z")),
    );
  });
  it("bounds awards at the daily cap, safe balance and bucket cap", () => {
    const w = { ...emptyWallet(), day: 100, earned: 39 };
    expect(cloudAward(w, "multiplication", 1, true, 40, 100)).toBe(1);
    expect(
      cloudAward(
        { ...w, balance: 1_000_000_000 },
        "multiplication",
        1,
        true,
        40,
        100,
      ),
    ).toBe(0);
    expect(
      cloudAward(
        { ...w, counts: { ...w.counts, "multiplication-1": 5 } },
        "multiplication",
        1,
        false,
        40,
        100,
      ),
    ).toBe(0);
  });
  it("bounds mastery session evidence while preserving achievements and commutative keys", () => {
    let p = initialProgress().multiplication;
    for (let i = 0; i < 20; i++) p = cloudProgress(p, true, 3, `session-${i}`);
    expect(p.advancedSessions).toHaveLength(2);
    expect(p.mastered).toBe(true);
    expect(cloudProgress(p, false, 3, "supported").mastered).toBe(true);
    expect(questionKey({ skill: "multiplication", a: 12, b: 11 })).toBe(
      questionKey({ skill: "multiplication", a: 11, b: 12 }),
    );
  });
});
