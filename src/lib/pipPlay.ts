export type PipActivity = "idle" | "pet" | "fetch" | "bubbles" | "dance";
export type PipBehavior = "watch" | "sniff" | "stretch" | "wander" | "sit";
export function nextBehavior(rng: () => number, previous: PipBehavior) {
  const options: PipBehavior[] = [
    "watch",
    "watch",
    "sniff",
    "stretch",
    "wander",
    "wander",
    "sit",
  ];
  const available = options.filter((value) => value !== previous);
  return {
    kind: available[
      Math.min(available.length - 1, Math.floor(rng() * available.length))
    ],
    duration: 4 + rng() * 4,
    x: (rng() - 0.5) * 2.6,
    z: (rng() - 0.5) * 1.4,
  };
}
export const places = {
  woodland: {
    name: "Woodland clearing",
    sky: "#dcebe1",
    ground: "#93ad80",
    accent: "#e1bd83",
    description:
      "A hollow-tree home, lanterns, wildflowers and a stream crossed by a little bridge.",
  },
  magic: {
    name: "Wizard glade",
    sky: "#44405f",
    ground: "#7e9d93",
    accent: "#bda1db",
    description: "Glowing mushrooms and a quiet lantern garden.",
  },
  rain: {
    name: "Rainy garden",
    sky: "#c9dce0",
    ground: "#8da799",
    accent: "#9cc9d2",
    description:
      "A broad-leaf shelter, shiny puddles, flowers and softly falling rain.",
  },
  moon: {
    name: "Moon camp",
    sky: "#242e48",
    ground: "#989fb4",
    accent: "#d6c6a7",
    description:
      "A silver moon habitat, crater rims and a little Earth in the sky.",
  },
} as const;
export type PipPlace = keyof typeof places;
