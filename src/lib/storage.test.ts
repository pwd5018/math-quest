import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { initialState, loadState, saveState, STORAGE_KEY } from "./storage";
let values: Map<string, string>;
beforeEach(() => {
  values = new Map();
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  });
});
afterEach(() => vi.unstubAllGlobals());
describe("local demo persistence", () => {
  it("initializes a fresh browser at zero without fictional progress", () => {
    const s = loadState();
    expect(s.state.ledger).toEqual([]);
    expect(s.state.attempts).toEqual([]);
    expect(s.warning).toBeUndefined();
  });
  it("round-trips durable progress and reward requests", () => {
    const s = initialState();
    s.nickname = "Pip";
    s.appearance = {
      ...s.appearance,
      outfit: "astronaut",
      hat: "flower",
      accent: "violet",
      move: "stars",
      sky: "starlight",
      motion: "calm",
      glasses: true,
    };
    s.progress.addition.stars = 2;
    saveState(s);
    expect(loadState().state).toEqual(s);
  });
  it("preserves unreadable saves and reports recovery", () => {
    values.set(STORAGE_KEY, "broken-json");
    expect(loadState().warning).toContain("could not be read");
    expect(values.get(STORAGE_KEY)).toBe("broken-json");
  });
  it("rejects unsupported versions and invalid negative wallet state", () => {
    for (const patch of [{ version: 2 }, { ledger: [{ amount: -1 }] }]) {
      values.set(STORAGE_KEY, JSON.stringify({ ...initialState(), ...patch }));
      expect(loadState().warning).toBeTruthy();
    }
  });
  it("surfaces quota errors instead of silently losing a state write", () => {
    vi.stubGlobal("localStorage", {
      setItem: () => {
        throw new Error("quota");
      },
    });
    expect(() => saveState(initialState())).toThrow("quota");
  });
});
