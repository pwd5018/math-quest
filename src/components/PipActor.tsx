import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as T from "three";
import { createPipScene } from "../lib/pipScene";
import { pipPose } from "../lib/pipPose";
import { random } from "../lib/math";
import { nextBehavior, type PipActivity } from "../lib/pipPlay";
import {
  fetchPose,
  reactionEnvelope,
  touchNames,
  type BodyPart,
} from "../lib/pipInteraction";
import type { Appearance } from "../lib/appearance";

export function PipActor({
  look,
  activity,
  token,
  moving,
  reaction,
  throwTo,
  onTouch,
  onFetch,
}: {
  look: Appearance;
  activity: PipActivity;
  token: number;
  moving: boolean;
  reaction: { part: BodyPart; variant: number };
  throwTo: [number, number];
  onTouch: (part: BodyPart) => void;
  onFetch: () => void;
}) {
  const model = useMemo(
    () => createPipScene(look),
    [look.outfit, look.accent, look.hat, look.glasses, look.sky],
  );
  useEffect(() => () => model.dispose(), [model]);
  const actor = useRef<T.Group>(null),
    ball = useRef<T.Mesh>(null);
  const time = useRef(0),
    age = useRef(0);
  const rng = useMemo(
    () => random(crypto.getRandomValues(new Uint32Array(1))[0]),
    [],
  );
  const behavior = useRef(nextBehavior(rng, "watch")),
    behaviorTime = useRef(0);
  const position = useRef(new T.Vector3()),
    target = useRef(new T.Vector3());
  const { invalidate, pointer } = useThree();
  useEffect(() => {
    age.current = 0;
    invalidate();
  }, [activity, token, invalidate]);
  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    if (moving) {
      time.current += dt;
      age.current += activity === "idle" ? dt : delta;
      if (activity === "idle") behaviorTime.current += dt;
    }
    if (moving && activity !== "idle") invalidate();
    if (
      moving &&
      activity === "idle" &&
      behaviorTime.current > behavior.current.duration
    ) {
      behavior.current = nextBehavior(rng, behavior.current.kind);
      behaviorTime.current = 0;
      target.current.set(
        behavior.current.kind === "wander" ? behavior.current.x * 0.65 : 0,
        0,
        behavior.current.kind === "wander" ? behavior.current.z * 0.6 : 0,
      );
    }
    const t = age.current,
      b = behavior.current.kind;
    const fetch = fetchPose(t, ...throwTo);
    if (activity === "fetch") position.current.set(fetch.x, 0, fetch.z);
    else {
      if (activity !== "idle") target.current.set(0, 0, 0);
      if (moving) position.current.lerp(target.current, 1 - Math.exp(-dt * 7));
    }
    const strength =
      activity === "pet"
        ? moving
          ? reactionEnvelope(t, reaction.part)
          : 0.65
        : 0;
    const part = reaction.part,
      variation = reaction.variant;
    const wiggle = Math.sin(t * (variation === 1 ? 23 : 18));
    const pose = pipPose(
      activity === "dance" ? "dance" : "idle",
      activity === "idle" ? time.current : t,
      moving ? look.motion : "still",
    );
    const blend = 1 - Math.exp(-dt * 24);
    const approach = (from: number, to: number) =>
      T.MathUtils.lerp(from, to, moving ? blend : 1);
    model.rig.position.y = approach(
      model.rig.position.y,
      pose.lift + (part === "paw" ? 0.05 * strength : 0),
    );
    model.rig.rotation.z = approach(
      model.rig.rotation.z,
      pose.lean + (part === "belly" ? wiggle * 0.065 * strength : 0),
    );
    model.rig.rotation.x = approach(
      model.rig.rotation.x,
      activity === "fetch" && t > 1.1 && t < 1.65
        ? 0.22
        : activity === "idle" && b === "sniff"
          ? 0.1
          : 0,
    );
    model.rig.scale.set(
      1 + (part === "belly" ? strength * 0.035 : 0),
      1 -
        (part === "belly"
          ? strength * 0.06
          : activity === "idle" && b === "sit"
            ? 0.08
            : 0),
      1,
    );
    model.head.rotation.set(
      approach(
        model.head.rotation.x,
        part === "nose"
          ? -0.13 * strength
          : part === "head"
            ? -0.1 * strength
            : 0,
      ),
      approach(
        model.head.rotation.y,
        part === "tail" ? -0.55 * strength : moving ? pointer.x * 0.2 : 0,
      ),
      approach(
        model.head.rotation.z,
        part === "ear" || part === "head"
          ? (0.12 + variation * 0.035) * strength
          : part === "belly"
            ? wiggle * 0.045 * strength
            : pose.headTilt,
      ),
    );
    model.eyeParts.forEach((eye, i) => {
      const closed =
        part === "eye"
          ? variation === 1 && i === 1
            ? 0.2
            : 0.95
          : part === "head" || part === "belly"
            ? 0.65
            : 0;
      eye.scale.y = Math.max(0.06, pose.blink * (1 - closed * strength));
    });
    model.brows.forEach((brow, i) => {
      brow.position.y =
        (part === "eye" ? 0.035 : part === "nose" ? -0.02 : 0) * strength;
      brow.rotation.z =
        (i ? 1 : -1) *
        (part === "belly" ? 0.045 : part === "eye" ? 0.06 : 0) *
        strength;
    });
    model.pupils.forEach((p) => {
      p.position.x = approach(p.position.x, moving ? pointer.x * 0.025 : 0);
      p.position.y = approach(p.position.y, moving ? pointer.y * 0.018 : 0);
    });
    model.nose.scale.set(
      0.13 * (1 + (part === "nose" ? wiggle * 0.12 * strength : 0)),
      0.088,
      0.09,
    );
    model.mouth.scale.set(
      1 + (part === "belly" ? 0.15 * strength : 0),
      1 + (part === "belly" ? wiggle * 0.1 * strength : 0),
      1,
    );
    model.ears.forEach((ear, i) => {
      const side = i ? 1 : -1;
      ear.rotation.z =
        -side * 0.19 +
        (part === "ear"
          ? side * wiggle * 0.22 * strength
          : part === "eye"
            ? side * 0.12 * strength
            : moving
              ? Math.sin(time.current * 1.6 + i) * 0.025
              : 0);
    });
    model.tail.rotation.y = approach(
      model.tail.rotation.y,
      part === "tail"
        ? wiggle * 0.4 * strength
        : moving
          ? Math.sin(time.current * (activity === "pet" ? 9 : 2.2)) * 0.16
          : 0,
    );
    model.leftArm.rotation.z = approach(
      model.leftArm.rotation.z,
      pose.leftArm +
        (part === "belly"
          ? -0.75 * strength
          : part === "paw"
            ? -1.75 * strength
            : 0),
    );
    model.rightArm.rotation.z = approach(
      model.rightArm.rotation.z,
      pose.rightArm +
        (part === "belly"
          ? 0.75 * strength
          : part === "paw" && variation === 2
            ? 1.75 * strength
            : 0),
    );
    if (moving && activity === "idle" && b === "stretch") {
      model.leftArm.rotation.z = -1.7;
      model.rightArm.rotation.z = 1.7;
    }
    model.legs.forEach(
      (leg, i) =>
        (leg.rotation.x =
          moving &&
          ((activity === "fetch" && t > 0.28 && t < 2.7) ||
            (activity === "idle" && b === "wander"))
            ? Math.sin(time.current * 13 + i * Math.PI) * 0.4
            : 0),
    );
    if (actor.current) {
      actor.current.position.copy(position.current);
      const facing =
        activity === "fetch"
          ? t < 1.4
            ? Math.atan2(throwTo[0], throwTo[1])
            : t < 2.7
              ? 0
              : 0.08
          : 0.08;
      actor.current.rotation.y = approach(actor.current.rotation.y, facing);
    }
    if (ball.current) {
      ball.current.position.set(
        activity === "fetch" ? fetch.ballX : 1.65,
        activity === "fetch" ? fetch.ballY : 0.19,
        activity === "fetch" ? fetch.ballZ : 1.1,
      );
      ball.current.rotation.z = time.current * 2;
    }
  });
  return (
    <>
      <group
        ref={actor}
        scale={1.05}
        onClick={(event) => {
          event.stopPropagation();
          if (event.delta > 6) return;
          let object: T.Object3D | null = event.object;
          let part: BodyPart = "belly";
          while (object && object !== actor.current) {
            if (
              object.userData.bodyPart &&
              Object.hasOwn(touchNames, object.userData.bodyPart)
            ) {
              part = object.userData.bodyPart;
              break;
            }
            object = object.parent;
          }
          onTouch(part);
        }}
      >
        <primitive object={model.rig} dispose={null} />
      </group>
      <mesh
        ref={ball}
        position={[1.65, 0.19, 1.1]}
        castShadow
        onClick={(e) => {
          e.stopPropagation();
          if (e.delta <= 6) onFetch();
        }}
      >
        <sphereGeometry args={[0.19, 32, 20]} />
        <meshPhysicalMaterial
          color="#f1a05d"
          roughness={0.28}
          clearcoat={0.7}
        />
        <mesh rotation={[0, 0, Math.PI / 4]}>
          <torusGeometry args={[0.185, 0.018, 8, 32]} />
          <meshStandardMaterial color="#fff4ce" />
        </mesh>
      </mesh>
    </>
  );
}
