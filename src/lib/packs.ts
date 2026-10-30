import type { State } from "./economy";
import { balance } from "./economy";

export const costumeNames = {
  pumpkin: "Pumpkin pal",
  witch: "Moonlight witch",
  ghost: "Friendly ghost",
  vampire: "Little vampire",
  knight: "Forest knight",
  dragon: "Emerald dragon",
  fairy: "Garden fairy",
  royal: "Royal explorer",
  robot: "Helpful robot",
  alien: "Cosmic visitor",
  cadet: "Star cadet",
  comet: "Comet captain",
  pirate: "Treasure pirate",
  sailor: "Sunny sailor",
  diver: "Reef diver",
  merfolk: "Ocean guardian",
  chef: "Little chef",
  pajamas: "Sleepy stargazer",
  artist: "Colorful artist",
  gardener: "Flower gardener",
  snowman: "Snow day",
  elf: "Woodland elf",
  reindeer: "Cozy reindeer",
  penguin: "Penguin party",
} as const;
export type Costume = keyof typeof costumeNames;
export const packs = [
  {
    id: "halloween",
    name: "Halloween stories",
    icon: "🎃",
    color: "#a878c3",
    description: "Four friendly, spooky looks for autumn adventures.",
    costumes: ["pumpkin", "witch", "ghost", "vampire"],
  },
  {
    id: "enchanted",
    name: "Enchanted woodland",
    icon: "✨",
    color: "#80a886",
    description: "Knights, dragons, fairies and a royal explorer.",
    costumes: ["knight", "dragon", "fairy", "royal"],
  },
  {
    id: "cosmic",
    name: "Cosmic explorers",
    icon: "🪐",
    color: "#849ac9",
    description: "A whole wardrobe for journeys among the stars.",
    costumes: ["robot", "alien", "cadet", "comet"],
  },
  {
    id: "ocean",
    name: "Ocean adventures",
    icon: "🐚",
    color: "#72b4bd",
    description: "Set sail, find treasure and explore the reef.",
    costumes: ["pirate", "sailor", "diver", "merfolk"],
  },
  {
    id: "cozy",
    name: "Cozy little days",
    icon: "🎨",
    color: "#cc9c85",
    description: "Make something, grow something, or get cozy.",
    costumes: ["chef", "pajamas", "artist", "gardener"],
  },
  {
    id: "winter",
    name: "Winter wonder",
    icon: "❄️",
    color: "#92b7ca",
    description: "Snowy friends and warm woodland celebrations.",
    costumes: ["snowman", "elf", "reindeer", "penguin"],
  },
] as const;
export type PackId = (typeof packs)[number]["id"];
export type PackSetting = { price: number; enabled: boolean };
export const packForOutfit = (outfit: string) =>
  packs.find((p) => (p.costumes as readonly string[]).includes(outfit));
export const ownsOutfit = (
  state: Pick<State, "ownedPacks">,
  outfit: string,
) => {
  const pack = packForOutfit(outfit);
  return !pack || (state.ownedPacks ?? []).includes(pack.id);
};
export function validatePackSetting(raw: PackSetting): PackSetting {
  if (
    !Number.isSafeInteger(raw.price) ||
    raw.price < 0 ||
    raw.price > 1_000_000 ||
    typeof raw.enabled !== "boolean"
  )
    throw new Error("Choose a whole-coin price from 0 to 1,000,000.");
  return { price: raw.price, enabled: raw.enabled };
}
export function setPackSetting(
  state: State,
  id: string,
  setting: PackSetting,
): State {
  if (!packs.some((p) => p.id === id))
    throw new Error("That costume pack is not available.");
  return {
    ...state,
    packSettings: { ...state.packSettings, [id]: validatePackSetting(setting) },
  };
}
export function buyPack(
  state: State,
  id: string,
  at: string,
  expectedPrice?: number,
): State {
  const pack = packs.find((p) => p.id === id);
  if (!pack) throw new Error("That costume pack is not available.");
  if (state.ownedPacks?.includes(id)) return state;
  const setting = state.packSettings?.[id];
  if (!setting?.enabled)
    throw new Error("Your grown-up has not opened this pack yet.");
  validatePackSetting(setting);
  if (expectedPrice !== undefined && setting.price !== expectedPrice)
    throw new Error(
      "The pack price changed. Review the new price before buying.",
    );
  if (balance(state) < setting.price)
    throw new Error("You need a few more coins for this pack.");
  return {
    ...state,
    ownedPacks: [...(state.ownedPacks ?? []), id],
    ledger: [
      ...state.ledger,
      {
        id: `pack-${id}`,
        amount: setting.price === 0 ? 0 : -setting.price,
        reason: `Costume pack: ${pack.name}`,
        reference: id,
        at,
      },
    ],
  };
}
