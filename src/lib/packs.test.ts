import { describe, it, expect } from "vitest";
import { initialState } from "./storage";
import { buyPack, packs, setPackSetting } from "./packs";
import { changeAppearance } from "./appearance";
import { nextBehavior } from "./pipPlay";
import { random } from "./math";
describe("permanent costume pack purchases", () => {
  const funded = () => {
    const s = initialState();
    s.ledger = [
      { id: "award", amount: 50, reason: "Parent award", at: "2026-10-29" },
    ];
    return s;
  };
  it("buys once, debits exactly the configured price, and leaves learning, requests and goals unchanged", () => {
    const before = setPackSetting(funded(), "halloween", {
      price: 20,
      enabled: true,
    });
    const after = buyPack(before, "halloween", "2026-10-29", 20);
    expect(after.ownedPacks).toEqual(["halloween"]);
    expect(after.ledger.at(-1)?.amount).toBe(-20);
    expect(after.progress).toEqual(before.progress);
    expect(after.goalId).toBe(before.goalId);
    expect(after.requests).toEqual([]);
    expect(after.sessions).toEqual([]);
    expect(buyPack(after, "halloween", "2026-10-29", 20)).toBe(after);
    expect(
      changeAppearance(after, { ...after.appearance, outfit: "witch" })
        .appearance.outfit,
    ).toBe("witch");
  });
  it("rejects insufficient funds, unopened packs, changed prices and unknown IDs", () => {
    const s = setPackSetting(initialState(), "halloween", {
      price: 20,
      enabled: true,
    });
    expect(() => buyPack(s, "halloween", "now", 20)).toThrow(/more coins/);
    expect(() => buyPack(s, "cozy", "now", 20)).toThrow(/not opened/);
    expect(() => buyPack(s, "unknown", "now", 20)).toThrow(/not available/);
    expect(() =>
      buyPack(
        setPackSetting(funded(), "halloween", { price: 25, enabled: true }),
        "halloween",
        "now",
        20,
      ),
    ).toThrow(/price changed/);
    expect(() =>
      changeAppearance(s, { ...s.appearance, outfit: "witch" }),
    ).toThrow(/Unlock/);
  });
  it("keeps ownership after price changes and disabling, supports explicit free packs, and validates prices", () => {
    const owned = buyPack(
      setPackSetting(initialState(), "halloween", { price: 0, enabled: true }),
      "halloween",
      "now",
      0,
    );
    const closed = setPackSetting(owned, "halloween", {
      price: 100,
      enabled: false,
    });
    expect(
      changeAppearance(closed, { ...closed.appearance, outfit: "ghost" })
        .appearance.outfit,
    ).toBe("ghost");
    for (const price of [-1, 0.1, NaN, 1_000_001])
      expect(() =>
        setPackSetting(initialState(), "halloween", { price, enabled: true }),
      ).toThrow();
    expect(packs.flatMap((p) => p.costumes)).toHaveLength(24);
  });
});
describe("bounded Pip personality", () => {
  it("varies behavior without immediate repeats and stays within the clearing", () => {
    const rng = random(123);
    let previous = nextBehavior(rng, "watch");
    const kinds = new Set([previous.kind]);
    for (let i = 0; i < 100; i++) {
      const next = nextBehavior(rng, previous.kind);
      expect(next.kind).not.toBe(previous.kind);
      expect(Math.abs(next.x)).toBeLessThanOrEqual(1.3);
      expect(Math.abs(next.z)).toBeLessThanOrEqual(0.7);
      expect(next.duration).toBeGreaterThanOrEqual(4);
      expect(next.duration).toBeLessThanOrEqual(8);
      kinds.add(next.kind);
      previous = next;
    }
    expect(kinds.size).toBe(5);
    expect(nextBehavior(random(123), "watch")).toEqual(
      nextBehavior(random(123), "watch"),
    );
  });
});
