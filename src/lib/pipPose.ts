import type { Appearance } from "./appearance";

export type PipAction = Appearance["move"] | "idle" | "cheer";
export function pipPose(
  action: PipAction,
  seconds: number,
  motion: Appearance["motion"],
) {
  const t = Math.max(0, Math.min(1, seconds / 2.2));
  const envelope = Math.sin(Math.PI * t);
  const moving = motion === "playful";
  const pose = {
    lift: 0,
    turn: 0,
    lean: 0,
    leftArm: 0.12,
    rightArm: -0.12,
    headTilt: 0,
    tail: 0,
    blink: 1,
  };
  if (action === "cheer") {
    pose.leftArm = -1.65;
    pose.rightArm = 1.65;
  }
  if (action === "wave") pose.rightArm = 2.1;
  if (motion === "still") return pose;
  if (motion === "calm") {
    pose.headTilt = action === "idle" ? 0 : Math.sin(t * Math.PI * 2) * 0.045;
    return pose;
  }
  if (moving) {
    pose.tail = Math.sin(seconds * 2.6) * 0.16;
    if (action === "hop" || action === "cheer")
      pose.lift = Math.abs(Math.sin(t * Math.PI * 3)) * envelope * 0.3;
    if (action === "twirl") pose.turn = t * Math.PI * 2;
    if (action === "dance") {
      pose.lean = Math.sin(t * Math.PI * 6) * envelope * 0.18;
      pose.leftArm = -0.7 + Math.sin(t * Math.PI * 8) * 0.5;
      pose.rightArm = 0.7 + Math.sin(t * Math.PI * 8) * 0.5;
    }
    if (action === "wave")
      pose.rightArm += Math.sin(t * Math.PI * 10) * envelope * 0.35;
    if (action !== "idle")
      pose.headTilt = Math.sin(t * Math.PI * 4) * envelope * 0.08;
    const blinkPhase = seconds % 4.7;
    pose.blink =
      blinkPhase > 4.48
        ? Math.max(0.08, Math.abs(blinkPhase - 4.59) / 0.11)
        : 1;
  }
  return pose;
}
