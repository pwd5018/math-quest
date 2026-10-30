import { describe, expect, it } from "vitest";
import { defaultAppearance, hatNames, outfitNames } from "./appearance";
import { pipPose, type PipAction } from "./pipPose";
import { createPipScene } from "./pipScene";
import { Mesh } from "three";

describe("3D Pip motion boundaries", () => {
  const actions: PipAction[] = [
    "idle",
    "cheer",
    "hop",
    "twirl",
    "stars",
    "dance",
    "wave",
  ];
  it("keeps Still and reduced-motion poses completely static for every move", () => {
    for (const action of actions)
      expect(pipPose(action, 0, "still")).toEqual(
        pipPose(action, 1.17, "still"),
      );
    expect(pipPose("cheer", 1, "still").rightArm).toBeGreaterThan(1);
  });
  it("Calm never spins, bounces, blinks or swishes its tail", () => {
    for (const action of actions) {
      const p = pipPose(action, 0.8, "calm");
      expect([p.lift, p.turn, p.lean, p.tail, p.blink]).toEqual([
        0, 0, 0, 0, 1,
      ]);
    }
  });
  it("finishes a true full turn and lands without lingering jumps", () => {
    expect(pipPose("twirl", 2.2, "playful").turn).toBeCloseTo(Math.PI * 2);
    expect(pipPose("hop", 2.2, "playful").lift).toBeCloseTo(0);
    expect(pipPose("hop", 0.7, "playful").lift).toBeGreaterThan(0);
    for (const action of actions)
      for (const time of [0, 0.1, 1, 2.2, 20])
        for (const value of Object.values(pipPose(action, time, "playful")))
          expect(Number.isFinite(value)).toBe(true);
  });
});

describe("original 3D Pip outfits", () => {
  it("builds all outfits with every hat and glasses as finite, disposable 3D geometry", () => {
    for (const outfit of Object.keys(
      outfitNames,
    ) as (keyof typeof outfitNames)[]) {
      for (const hat of Object.keys(hatNames) as (keyof typeof hatNames)[]) {
        const model = createPipScene({
          ...defaultAppearance(),
          outfit,
          hat,
          glasses: true,
        });
        let meshes = 0;
        model.scene.traverse((object) => {
          if (object instanceof Mesh) {
            meshes++;
            const attribute = object.geometry.getAttribute("position");
            expect(attribute.count).toBeGreaterThan(0);
            expect(Array.from(attribute.array).every(Number.isFinite)).toBe(
              true,
            );
          }
        });
        expect(meshes).toBeGreaterThan(45);
        expect(model.leftArm.parent).toBe(model.rig);
        expect(model.head.parent).toBe(model.rig);
        model.dispose();
      }
    }
  });
});
