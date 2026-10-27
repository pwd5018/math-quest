import type { State } from "./economy";

export const outfitNames = {
  explorer: "Woodland explorer",
  wizard: "Starry wizard",
  astronaut: "Space adventurer",
  raincoat: "Puddle jumper",
} as const;
export const accentColors = {
  mint: "#438b7b",
  violet: "#8f77bd",
  sunshine: "#d6a441",
  berry: "#c7758d",
} as const;
export const hatNames = {
  none: "Just my ears",
  cap: "Adventure cap",
  crown: "Little crown",
  flower: "Daisy day",
} as const;
export const moveNames = {
  hop: "Happy hops",
  twirl: "Fox twirl",
  stars: "Star shower",
  dance: "Happy dance",
  wave: "Little hello",
} as const;
export type Appearance = {
  outfit: keyof typeof outfitNames;
  accent: keyof typeof accentColors;
  hat: keyof typeof hatNames;
  glasses: boolean;
  move: keyof typeof moveNames;
  sky: "day" | "sunset" | "starlight";
  motion: "playful" | "calm" | "still";
  voice: "off" | "soft" | "chirpy";
};
export function defaultAppearance(): Appearance {
  return {
    outfit: "explorer",
    accent: "mint",
    hat: "none",
    glasses: false,
    move: "hop",
    sky: "day",
    motion: "playful",
    voice: "soft",
  };
}
export function validateAppearance(raw: unknown): Appearance {
  if (!raw || typeof raw !== "object")
    throw new Error("Choose a valid look for Pip.");
  const p = raw as Appearance;
  if (
    !Object.hasOwn(outfitNames, p.outfit) ||
    !Object.hasOwn(accentColors, p.accent) ||
    !Object.hasOwn(hatNames, p.hat) ||
    !Object.hasOwn(moveNames, p.move) ||
    typeof p.glasses !== "boolean" ||
    !["day", "sunset", "starlight"].includes(p.sky) ||
    !["playful", "calm", "still"].includes(p.motion) ||
    !["off", "soft", "chirpy"].includes(p.voice)
  )
    throw new Error("That Pip setting is not available.");
  // Copy only cosmetic fields. A cosmetic update cannot carry learning/economy overrides.
  return {
    outfit: p.outfit,
    accent: p.accent,
    hat: p.hat,
    glasses: p.glasses,
    move: p.move,
    sky: p.sky,
    motion: p.motion,
    voice: p.voice,
  };
}
export function restoreAppearance(raw: unknown): Appearance {
  try {
    return validateAppearance({ ...defaultAppearance(), ...(raw as object) });
  } catch {
    return defaultAppearance();
  }
}
export function changeAppearance(state: State, raw: unknown): State {
  return { ...state, appearance: validateAppearance(raw) };
}
