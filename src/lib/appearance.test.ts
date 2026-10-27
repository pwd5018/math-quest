import { describe, expect, it } from "vitest";
import { changeAppearance, defaultAppearance } from "./appearance";
import { initialState } from "./storage";
import { migrateState } from "./curriculum";

describe("cosmetic isolation and save recovery", () => {
  it("changes only cosmetics even when a proposal includes forged learning or economy fields", () => {
    const state = initialState();
    state.ledger.push({
      id: "earned",
      amount: 15,
      reason: "Practice",
      at: "2026-10-26",
    });
    state.progress.multiplication.stars = 2;
    const before = structuredClone(state);
    const changed = changeAppearance(state, {
      ...defaultAppearance(),
      outfit: "wizard",
      hat: "crown",
      balance: 999999,
      ledger: [],
      settings: { dailyCap: 999 },
      role: "parent",
    });
    expect(changed.appearance.outfit).toBe("wizard");
    expect(changed.appearance.hat).toBe("crown");
    expect(changed.appearance).not.toHaveProperty("balance");
    expect({ ...changed, appearance: before.appearance }).toEqual(before);
    expect(state).toEqual(before);
  });
  it("rejects invalid cosmetic commands before modifying a saved state", () => {
    const state = initialState(),
      before = structuredClone(state);
    for (const patch of [
      { outfit: "unknown" },
      { motion: "flashing" },
      { glasses: "yes" },
      { hat: "<script>" },
      { voice: "loud" },
    ])
      expect(() =>
        changeAppearance(state, { ...defaultAppearance(), ...patch }),
      ).toThrow();
    expect(state).toEqual(before);
  });
  it("adds a quiet voice preference to legacy looks without discarding their chosen outfit or motion", () => {
    const appearance = {
      ...defaultAppearance(),
      outfit: "wizard" as const,
      motion: "still" as const,
    };
    delete (appearance as Partial<typeof appearance>).voice;
    const state = { ...initialState(), appearance };
    const restored = migrateState(state);
    expect(restored.appearance).toMatchObject({
      outfit: "wizard",
      motion: "still",
      voice: "soft",
    });
  });
  it("recovers missing or invalid legacy cosmetics without resetting learning history, goals, rewards or coins", () => {
    for (const appearance of [undefined, { outfit: "unavailable" }]) {
      const state = initialState();
      state.ledger.push({
        id: "earned",
        amount: 12,
        reason: "Practice",
        at: "2026-10-26",
      });
      state.progress.addition.stars = 3;
      const legacy = { ...state, appearance } as typeof state;
      const migrated = migrateState(legacy);
      expect(migrated.appearance).toEqual(defaultAppearance());
      expect({ ...migrated, appearance: state.appearance }).toEqual(state);
    }
  });
});
