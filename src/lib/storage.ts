import { initialProgress } from "./learning";
import type { State } from "./economy";
import { defaultCurriculum, migrateState } from "./curriculum";
import { defaultAppearance } from "./appearance";
export const STORAGE_KEY = "math-quest-demo-v1";
export function initialState(): State {
  return {
    version: 1,
    ownedPacks: [],
    packSettings: {},
    appearance: defaultAppearance(),
    nickname: "Explorer",
    attempts: [],
    events: [],
    progress: initialProgress(),
    sessions: [],
    requests: [],
    settings: {
      dailyCap: 40,
      weeklySessions: 4,
      curriculum: defaultCurriculum(),
    },
    goalId: "picnic",
    ledger: [],
    rewards: [
      {
        id: "movie",
        title: "Family movie night",
        description: "You pick the movie. We bring the popcorn!",
        cost: 30,
        emoji: "🍿",
        approved: true,
        archived: false,
        available: true,
        limit: 0,
      },
      {
        id: "picnic",
        title: "A park picnic",
        description: "An afternoon outside with your favorite snacks.",
        cost: 60,
        emoji: "🧺",
        approved: true,
        archived: false,
        available: true,
        limit: 1,
      },
      {
        id: "game",
        title: "Choose a game",
        description: "Pick a board game for a cozy family game night.",
        cost: 40,
        emoji: "🎲",
        approved: true,
        archived: false,
        available: true,
        limit: 0,
      },
    ],
  };
}
export function loadState(): { state: State; warning?: string } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { state: initialState() };
    const s = JSON.parse(raw) as State;
    if (
      s.version !== 1 ||
      !Array.isArray(s.attempts) ||
      !Array.isArray(s.ledger) ||
      !Array.isArray(s.rewards) ||
      !Array.isArray(s.requests) ||
      !Array.isArray(s.sessions) ||
      !s.settings ||
      !s.progress ||
      Object.values(s.progress).length !== 4 ||
      !Object.values(s.progress).every(
        (p) => p && Array.isArray(p.advancedSessions),
      ) ||
      !s.ledger.every((e) => Number.isSafeInteger(e.amount)) ||
      s.ledger.reduce((n, e) => n + e.amount, 0) < 0
    )
      throw new Error("Invalid save");
    return { state: migrateState(s) };
  } catch {
    return {
      state: initialState(),
      warning:
        "Your saved demo could not be read. A fresh adventure is open; the old save has not been overwritten.",
    };
  }
}
export function saveState(state: State) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
