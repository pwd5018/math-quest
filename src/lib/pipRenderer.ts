import * as T from "three";
import type { Appearance } from "./appearance";
import { pipPose, type PipAction } from "./pipPose";
import { createPipScene } from "./pipScene";

export type PipInput = {
  look: Appearance;
  action: PipAction;
  token: number;
  turn: number;
  gazeX: number;
  gazeY: number;
  reduced: boolean;
  stillPreview?: boolean;
};
type View = {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  model: ReturnType<typeof createPipScene>;
  input: () => PipInput;
  failed: () => void;
  visible: boolean;
  dirty: boolean;
  lastAction: string;
  started: number;
  lastFrame: number;
  signature: string;
  observer: IntersectionObserver;
  resize: ResizeObserver;
};
const views = new Set<View>();
let renderer: T.WebGLRenderer | null = null;
let frame = 0;
const modelSignature = (look: Appearance) =>
  [look.outfit, look.accent, look.hat, look.glasses, look.sky].join(":");

function schedule() {
  if (!frame && views.size && !document.hidden)
    frame = requestAnimationFrame(render);
}
function render(now: number) {
  frame = 0;
  if (!renderer || document.hidden) return;
  let running = false;
  for (const v of views) {
    if (!v.visible) continue;
    const input = v.input();
    const motion =
      input.reduced || input.stillPreview ? "still" : input.look.motion;
    const actionKey = `${input.action}:${input.token}`;
    if (v.lastAction !== actionKey) {
      v.lastAction = actionKey;
      v.started = now;
    }
    const elapsed = (now - v.started) / 1000;
    const animated =
      motion === "playful" ||
      (motion === "calm" && input.action !== "idle" && elapsed < 2.2);
    const settling =
      motion === "calm" &&
      input.action !== "idle" &&
      elapsed >= 2.2 &&
      v.lastFrame < v.started + 2200;
    running ||= animated;
    if (now - v.lastFrame < 1000 / 30) {
      running ||= v.dirty;
      continue;
    }
    if (!v.dirty && !settling && !animated) continue;
    const rect = v.canvas.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) continue;
    if (modelSignature(input.look) !== v.signature) {
      v.model.dispose();
      v.model = createPipScene(input.look);
      v.signature = modelSignature(input.look);
    }
    const pose = pipPose(
      input.action,
      input.action === "idle" ? now / 1000 : elapsed,
      motion,
    );
    const m = v.model;
    m.rig.position.y =
      pose.lift + (motion === "playful" ? Math.sin(now / 1300) * 0.015 : 0);
    m.rig.rotation.set(0, input.turn + pose.turn, pose.lean);
    m.head.rotation.set(
      motion === "playful" ? -input.gazeY * 0.06 : 0,
      motion === "playful" ? input.gazeX * 0.1 : 0,
      pose.headTilt,
    );
    m.leftArm.rotation.z = pose.leftArm;
    m.rightArm.rotation.z = pose.rightArm;
    m.tail.rotation.y = pose.tail;
    m.eyes.scale.y = pose.blink;
    m.pupils.forEach((p) =>
      p.position.set(
        motion === "playful" ? input.gazeX * 0.024 : 0,
        motion === "playful" ? -input.gazeY * 0.024 : 0,
        0,
      ),
    );
    m.ears.forEach((ear, i) => {
      ear.rotation.z =
        (i ? -0.19 : 0.19) +
        (motion === "playful" ? Math.sin(now / 1900 + i) * 0.035 : 0);
    });
    m.sparkles.visible =
      input.action === "stars" && motion === "playful" && elapsed < 2.2;
    m.sparkles.children.forEach((star) => {
      const phase = star.userData.phase + elapsed * 1.5;
      star.position.set(
        Math.cos(phase) * 1.13,
        1.8 + Math.sin(phase * 1.5) * 0.85,
        Math.sin(phase) * 0.7,
      );
      star.rotation.y = phase;
    });
    const pixels = Math.max(
      32,
      Math.min(
        512,
        Math.round(rect.width * Math.min(devicePixelRatio || 1, 1.75)),
      ),
    );
    if (v.canvas.width !== pixels || v.canvas.height !== pixels) {
      v.canvas.width = pixels;
      v.canvas.height = pixels;
    }
    try {
      renderer.render(m.scene, m.camera);
      v.context.clearRect(0, 0, pixels, pixels);
      v.context.drawImage(renderer.domElement, 0, 0, pixels, pixels);
      v.canvas.dataset.renderer = "webgl";
      v.canvas.dataset.frame = String(Number(v.canvas.dataset.frame ?? 0) + 1);
      v.canvas.dataset.motion = motion;
      v.canvas.dataset.turn = (input.turn + pose.turn).toFixed(3);
    } catch {
      v.failed();
      v.visible = false;
    }
    v.dirty = false;
    v.lastFrame = now;
  }
  if (running) schedule();
}
function visibility() {
  if (document.hidden) {
    cancelAnimationFrame(frame);
    frame = 0;
  } else {
    views.forEach((v) => (v.dirty = true));
    schedule();
  }
}

/** One WebGL context composites each visible 3D view onto its own transparent canvas. */
export function mountPip(
  canvas: HTMLCanvasElement,
  input: () => PipInput,
  failed: () => void,
) {
  if (!renderer) {
    renderer = new T.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "low-power",
    });
    const owner = renderer;
    renderer.setSize(512, 512, false);
    renderer.setPixelRatio(1);
    renderer.setClearColor(0, 0);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = T.PCFShadowMap;
    renderer.outputColorSpace = T.SRGBColorSpace;
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.domElement.addEventListener("webglcontextlost", (event) => {
      if (renderer !== owner) return;
      event.preventDefault();
      views.forEach((v) => {
        v.visible = false;
        v.failed();
      });
      cancelAnimationFrame(frame);
      frame = 0;
    });
    document.addEventListener("visibilitychange", visibility);
  }
  if (renderer.getContext().isContextLost())
    throw new Error("WebGL context unavailable");
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas unavailable");
  const model = createPipScene(input().look);
  const view: View = {
    canvas,
    context,
    model,
    input,
    failed,
    visible: false,
    dirty: true,
    lastAction: "",
    started: 0,
    lastFrame: 0,
    signature: modelSignature(input().look),
    observer: null!,
    resize: null!,
  };
  view.observer = new IntersectionObserver((entries) => {
    view.visible = entries.some((e) => e.isIntersecting);
    view.dirty = true;
    schedule();
  });
  view.resize = new ResizeObserver(() => {
    view.dirty = true;
    schedule();
  });
  views.add(view);
  view.observer.observe(canvas);
  view.resize.observe(canvas);
  schedule();
  return {
    invalidate() {
      view.dirty = true;
      schedule();
    },
    dispose() {
      if (!views.delete(view)) return;
      view.observer.disconnect();
      view.resize.disconnect();
      view.model.dispose();
      if (!views.size) {
        cancelAnimationFrame(frame);
        frame = 0;
        renderer?.dispose();
        renderer?.forceContextLoss();
        renderer = null;
        document.removeEventListener("visibilitychange", visibility);
      }
    },
  };
}
