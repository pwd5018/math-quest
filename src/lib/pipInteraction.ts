export const touchNames = {
  belly: "Tickle tummy",
  eye: "Peekaboo",
  nose: "Boop nose",
  ear: "Tickle ear",
  head: "Stroke head",
  paw: "High five",
  tail: "Touch tail",
} as const;
export type BodyPart = keyof typeof touchNames;
export type PipSound =
  | "hello"
  | "giggle"
  | "peek"
  | "sniff"
  | "chirp"
  | "purr"
  | "highfive"
  | "swish"
  | "fetch"
  | "pop"
  | "dance";
export const reactions: Record<
  BodyPart,
  { duration: number; sound: PipSound; feedback: string }
> = {
  belly: {
    duration: 1.05,
    sound: "giggle",
    feedback: "That tickles! Pip curls his paws around his tummy.",
  },
  eye: {
    duration: 0.48,
    sound: "peek",
    feedback: "Peekaboo! A quick blink, then a curious little look.",
  },
  nose: {
    duration: 0.7,
    sound: "sniff",
    feedback: "Boop! Pip wrinkles his nose and sniffs your hand.",
  },
  ear: {
    duration: 0.65,
    sound: "chirp",
    feedback: "Flick! Pip turns an ear toward you.",
  },
  head: {
    duration: 0.95,
    sound: "purr",
    feedback: "Pip leans into your hand. A very contented fox.",
  },
  paw: {
    duration: 0.75,
    sound: "highfive",
    feedback: "High five! Right back at you.",
  },
  tail: {
    duration: 0.8,
    sound: "swish",
    feedback: "Who’s there? Pip looks back with a fluffy tail swish.",
  },
};
/** Smooth start and finish; a single reaction never loops or holds the input lock. */
export function reactionEnvelope(age: number, part: BodyPart) {
  const t = Math.min(1, Math.max(0, age / reactions[part].duration));
  return Math.sin(Math.PI * t) ** 0.8;
}
export function nextReactionVariant(previous: number, rng: () => number) {
  return (previous + 1 + Math.min(1, Math.floor(rng() * 2))) % 3;
}
/** Shared phases keep the ball and Pip together at pickup and hand-back. */
export function fetchPose(age: number, x: number, z: number) {
  const smooth = (n: number) => {
    const t = Math.max(0, Math.min(1, n));
    return t * t * (3 - 2 * t);
  };
  const outward = smooth((age - 0.28) / 0.95);
  const returning = smooth((age - 1.55) / 1.15);
  const amount = outward * (1 - returning);
  const carried = age >= 1.4 && age < 2.85;
  const flight = Math.min(1, age / 0.65);
  const pickup = smooth((age - 1.25) / 0.3);
  const drop = smooth((age - 2.65) / 0.45);
  const handX = x * amount,
    handZ = z * amount + 0.7 * pickup;
  return {
    x: x * amount,
    z: z * amount,
    carried,
    ballX:
      age < 1.25
        ? 1.65 + (x - 1.65) * flight
        : handX * (1 - drop) + 1.65 * drop,
    ballZ:
      age < 1.25 ? 1.1 + (z - 1.1) * flight : handZ * (1 - drop) + 1.1 * drop,
    ballY:
      age < 1.25
        ? 0.19 + Math.sin(flight * Math.PI) * 1.4
        : 0.19 + 0.86 * pickup * (1 - drop),
  };
}
