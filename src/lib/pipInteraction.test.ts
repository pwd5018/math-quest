import { describe, expect, it } from "vitest";
import { defaultAppearance, restoreAppearance, voiceNames } from "./appearance";
import { createPipScene } from "./pipScene";
import {
  fetchPose,
  nextReactionVariant,
  reactions,
  reactionEnvelope,
} from "./pipInteraction";
import { synthesizeReaction } from "./pipVoice";

describe("responsive Pip play", () => {
  it("finishes body reactions promptly with smooth silent endpoints", () => {
    for (const part of Object.keys(reactions) as (keyof typeof reactions)[]) {
      expect(reactions[part].duration).toBeLessThanOrEqual(1.2);
      expect(reactionEnvelope(0, part)).toBe(0);
      expect(reactionEnvelope(reactions[part].duration / 2, part)).toBeCloseTo(
        1,
      );
      expect(reactionEnvelope(10, part)).toBeLessThan(0.0001);
    }
    for (let previous = 0; previous < 3; previous++)
      for (const r of [0, 0.3, 0.5, 0.999])
        expect(nextReactionVariant(previous, () => r)).not.toBe(previous);
  });
  it("picks body regions from the same articulated model that is rendered", () => {
    const model = createPipScene(defaultAppearance());
    const parts = new Set<string>();
    model.rig.traverse((o) => {
      if (o.userData.bodyPart) parts.add(o.userData.bodyPart);
    });
    expect([...parts].sort()).toEqual(Object.keys(reactions).sort());
    expect(model.eyeParts).toHaveLength(2);
    model.dispose();
  });
  it("keeps the pickup, carry, and hand-back trajectory continuous", () => {
    for (const [x, z] of [
      [-1.7, 0.4],
      [0.1, 1.4],
      [1.7, -0.7],
    ]) {
      const start = fetchPose(0, x, z),
        end = fetchPose(3.1, x, z);
      expect(start.ballX).toBeCloseTo(1.65);
      expect(start.ballZ).toBeCloseTo(1.1);
      expect(end.ballX).toBeCloseTo(start.ballX);
      expect(end.ballY).toBeCloseTo(start.ballY);
      expect(end.x).toBeCloseTo(0);
      expect(end.z).toBeCloseTo(0);
      for (const time of [0.65, 1.25, 1.4, 1.55, 2.65, 2.7, 2.85, 3.1]) {
        const a = fetchPose(time - 0.0001, x, z),
          b = fetchPose(time + 0.0001, x, z);
        for (const key of ["ballX", "ballY", "ballZ", "x", "z"] as const)
          expect(Math.abs(a[key] - b[key])).toBeLessThan(0.01);
      }
    }
  });
  it("saves every voice style and produces distinct bounded reaction waveforms", () => {
    const fingerprints = new Set<string>();
    for (const mode of Object.keys(voiceNames) as (keyof typeof voiceNames)[]) {
      expect(
        restoreAppearance({ ...defaultAppearance(), voice: mode }).voice,
      ).toBe(mode);
      const samples = synthesizeReaction(8000, mode, "giggle", 1);
      expect(samples.length).toBeLessThan(8000);
      expect(samples[0]).toBe(0);
      expect(Math.abs(samples.at(-1)!)).toBeLessThan(0.001);
      expect(
        [...samples].every((x) => Number.isFinite(x) && Math.abs(x) < 0.9),
      ).toBe(true);
      if (mode === "off") expect(samples.every((x) => x === 0)).toBe(true);
      else fingerprints.add([...samples.slice(100, 110)].join(","));
    }
    expect(fingerprints.size).toBe(5);
    expect(synthesizeReaction(8000, "soft", "giggle")).not.toEqual(
      synthesizeReaction(8000, "soft", "sniff"),
    );
    expect(() => synthesizeReaction(192000, "soft")).toThrow();
  });
});
