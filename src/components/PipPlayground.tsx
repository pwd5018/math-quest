import {
  Component,
  Suspense,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as T from "three";
import { PipActor } from "./PipActor";
import { PipHabitat } from "./PipHabitat";
import {
  reactions,
  touchNames,
  nextReactionVariant,
  type BodyPart,
} from "../lib/pipInteraction";
import { voiceNames } from "../lib/appearance";
import { places, type PipActivity, type PipPlace } from "../lib/pipPlay";
import type { Appearance } from "../lib/appearance";
import { playPipVoice, stopPipVoice } from "../lib/pipVoice";
import { Companion } from "./Companion";

class SceneBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
const activities = [
  {
    id: "pet",
    name: "A little affection",
    icon: "♡",
    hint: "Pet Pip and watch his ears and tail.",
  },
  {
    id: "fetch",
    name: "Play fetch",
    icon: "◉",
    hint: "Toss the ball. Pip will bring it back.",
  },
  {
    id: "bubbles",
    name: "Blow bubbles",
    icon: "◌",
    hint: "Make a bubble cloud, then tap bubbles to pop them.",
  },
  {
    id: "dance",
    name: "Dance together",
    icon: "♫",
    hint: "Pip has a few new moves to show you.",
  },
] as const;

function Bubble({
  index,
  moving,
  pop,
  popped,
}: {
  index: number;
  moving: boolean;
  pop: () => void;
  popped: boolean;
}) {
  const ref = useRef<T.Mesh>(null);
  const age = useRef(0);
  useFrame((_, delta) => {
    if (moving) age.current += Math.min(delta, 0.05);
    if (ref.current) {
      ref.current.position.set(
        Math.sin(index * 2.4 + age.current * 0.8) * 1.8,
        0.7 + ((age.current * 0.45 + index * 0.23) % 2.9),
        Math.cos(index * 1.6) * 1.2 + 0.5,
      );
    }
  });
  if (popped) return null;
  return (
    <mesh
      ref={ref}
      position={[Math.sin(index) * 1.5, 1 + index * 0.14, 0.5]}
      onClick={(event) => {
        event.stopPropagation();
        pop();
      }}
    >
      <sphereGeometry args={[0.14 + (index % 3) * 0.035, 24, 16]} />
      <meshPhysicalMaterial
        color={index % 2 ? "#dfc5ee" : "#c0e9e1"}
        roughness={0.1}
        metalness={0.05}
        transparent
        opacity={0.48}
        clearcoat={1}
      />
    </mesh>
  );
}
function CameraReset({ token, angle }: { token: number; angle: number }) {
  const { camera, invalidate } = useThree();
  useEffect(() => {
    camera.position.set(
      0.6 * Math.cos(angle) + 10 * Math.sin(angle),
      4.6,
      10 * Math.cos(angle) - 0.6 * Math.sin(angle),
    );
    camera.lookAt(0, 1.35, 0);
    invalidate();
  }, [token, angle, camera, invalidate]);
  return null;
}

export default function PipPlayground({
  look,
  onDress,
  onVoice,
}: {
  look: Appearance;
  onDress: () => void;
  onVoice: (voice: Appearance["voice"]) => void;
}) {
  const [place, setPlace] = useState<PipPlace>("woodland"),
    [activity, setActivity] = useState<PipActivity>("idle"),
    [token, setToken] = useState(0),
    [cameraToken, setCameraToken] = useState(0),
    [popped, setPopped] = useState<number[]>([]);
  const pops = popped.length;
  const [reaction, setReaction] = useState<{ part: BodyPart; variant: number }>(
    { part: "head", variant: 0 },
  );
  const lastVariant = useRef(0);
  const [aiming, setAiming] = useState(false);
  const [throwTo, setThrowTo] = useState<[number, number]>([1.5, 0.4]);
  useEffect(() => {
    if (activity === "idle" || activity === "bubbles") return;
    const timeout = setTimeout(
      () => setActivity("idle"),
      (activity === "pet"
        ? reactions[reaction.part].duration
        : activity === "fetch"
          ? 3.1
          : 2.1) * 1000,
    );
    return () => clearTimeout(timeout);
  }, [activity, token, reaction.part]);
  useEffect(() => () => stopPipVoice(), []);
  const [cameraAngle, setCameraAngle] = useState(0);
  const [reduced, setReduced] = useState(false),
    [visible, setVisible] = useState(!document.hidden);
  const [intersecting, setIntersecting] = useState(true);
  const surface = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!surface.current) return;
    const observer = new IntersectionObserver((entries) =>
      setIntersecting(entries.some((e) => e.isIntersecting)),
    );
    observer.observe(surface.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const change = () => setReduced(media.matches);
    change();
    media.addEventListener("change", change);
    const visibility = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      media.removeEventListener("change", change);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, []);
  const moving = !reduced && look.motion !== "still" && visible && intersecting;
  const playful = moving && look.motion === "playful";
  const [feedback, setFeedback] = useState(
    "Pip’s happy you’re here. Pick a toy or tap Pip to say hello.",
  );
  function touch(part: BodyPart) {
    const variant = nextReactionVariant(lastVariant.current, Math.random);
    lastVariant.current = variant;
    setAiming(false);
    setReaction({ part, variant });
    setActivity("pet");
    setToken((n) => n + 1);
    setPopped([]);
    setFeedback(reactions[part].feedback);
    void playPipVoice(look.voice, reactions[part].sound, variant);
  }
  function throwBall(x: number, z: number) {
    setThrowTo([
      Math.max(-2, Math.min(2, x)),
      Math.max(-0.7, Math.min(1.4, z)),
    ]);
    setAiming(false);
    setActivity("fetch");
    setToken((n) => n + 1);
    setPopped([]);
    setFeedback(
      "Pip watches the ball, scoops it up and brings it back to you!",
    );
    void playPipVoice(look.voice, "fetch", token % 3);
  }
  function play(next: PipActivity) {
    if (next === "pet") {
      touch("head");
      return;
    }
    if (next === "fetch") {
      setActivity("idle");
      setAiming(true);
      setFeedback(
        "Where shall we throw? Tap open ground, or choose a throw below.",
      );
      return;
    }
    setAiming(false);
    setActivity(next);
    setToken((n) => n + 1);
    setPopped([]);
    setFeedback(
      next === "bubbles"
        ? "Pop! Tap the bubbles or use the button below."
        : "A quick little dance, just for you.",
    );
    void playPipVoice(
      look.voice,
      next === "bubbles" ? "chirp" : "dance",
      token % 3,
    );
  }
  function popBubble(index: number) {
    setPopped((current) =>
      current.includes(index) ? current : [...current, index],
    );
    void playPipVoice(look.voice, "pop", index % 3);
  }
  return (
    <>
      <section className="page-heading">
        <div>
          <div className="eyebrow">A LITTLE WORLD. A VERY GOOD FRIEND.</div>
          <h1>Play with Pip</h1>
          <p>A place to explore, be silly, and spend a little time together.</p>
        </div>
        <button className="secondary" onClick={onDress}>
          Dress up Pip
        </button>
      </section>
      <div className="play-place-tabs" aria-label="Choose a place">
        {(Object.keys(places) as PipPlace[]).map((id) => (
          <button
            key={id}
            className="secondary"
            aria-pressed={place === id}
            onClick={() => {
              setPlace(id);
              setActivity("idle");
              setAiming(false);
              setPopped([]);
              setFeedback(places[id].description);
            }}
          >
            {places[id].name}
          </button>
        ))}
      </div>
      <div className="pip-play-layout">
        <section
          className="pip-clearing"
          aria-label={places[place].name}
          ref={surface}
        >
          <div className="clearing-caption">
            <span>{places[place].name}</span>
            <div className="clearing-camera-buttons">
              <button
                className="secondary"
                aria-label="Turn view left"
                onClick={() => setCameraAngle((a) => a - 0.3)}
              >
                ↶
              </button>
              <button
                className="secondary"
                aria-label="Turn view right"
                onClick={() => setCameraAngle((a) => a + 0.3)}
              >
                ↷
              </button>
              <button
                onClick={() => {
                  setCameraAngle(0);
                  setCameraToken((n) => n + 1);
                }}
                className="secondary"
              >
                Reset view
              </button>
            </div>
          </div>
          <SceneBoundary
            fallback={
              <div className="play-fallback">
                <Companion look={look} />
                <p>
                  This browser couldn’t open the 3D clearing. You can still
                  dress up and play with Pip here.
                </p>
              </div>
            }
          >
            <Suspense
              fallback={
                <p className="play-loading">
                  Pip’s getting the clearing ready…
                </p>
              }
            >
              <Canvas
                shadows={{ type: T.PCFShadowMap }}
                dpr={[1, 1.5]}
                camera={{ position: [0.6, 4.6, 10], fov: 38 }}
                frameloop={
                  !visible || !intersecting
                    ? "never"
                    : playful || (moving && activity !== "idle")
                      ? "always"
                      : "demand"
                }
                gl={{ antialias: true, alpha: false }}
                fallback={
                  <span aria-hidden="true">Canvas is unavailable.</span>
                }
                onCreated={({ gl }) => {
                  gl.toneMapping = T.ACESFilmicToneMapping;
                  gl.toneMappingExposure = 1.05;
                  gl.domElement.dataset.scene = "pip-playground";
                }}
              >
                <PipHabitat
                  place={place}
                  moving={playful}
                  onBubbles={() => play("bubbles")}
                  aiming={aiming}
                  onThrow={throwBall}
                />
                <PipActor
                  look={look}
                  activity={activity}
                  token={token}
                  moving={moving && (playful || activity !== "idle")}
                  reaction={reaction}
                  throwTo={throwTo}
                  onTouch={touch}
                  onFetch={() => play("fetch")}
                />
                {activity === "bubbles" &&
                  Array.from({ length: 10 }, (_, i) => (
                    <Bubble
                      key={`${token}-${i}`}
                      index={i}
                      moving={playful}
                      popped={popped.includes(i)}
                      pop={() => popBubble(i)}
                    />
                  ))}
                <OrbitControls
                  makeDefault
                  target={[0, 1.35, 0]}
                  enablePan={false}
                  enableDamping={false}
                  minDistance={6}
                  maxDistance={12}
                  minPolarAngle={0.65}
                  maxPolarAngle={1.4}
                />
                <CameraReset token={cameraToken} angle={cameraAngle} />
              </Canvas>
            </Suspense>
          </SceneBoundary>
          <p className="clearing-help">
            Tap Pip’s tummy, nose, eyes, ears or paws. Drag to look around.
          </p>
        </section>
        <aside className="pip-play-actions">
          <div className="eyebrow">LET’S DO SOMETHING TOGETHER</div>
          <label className="play-voice">
            Pip’s voice
            <select
              aria-label="Pip’s play voice"
              value={look.voice}
              onChange={(e) => {
                const voice = e.target.value as Appearance["voice"];
                onVoice(voice);
                void playPipVoice(voice, "hello");
              }}
            >
              {Object.entries(voiceNames).map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          {activities.map((item) => (
            <button
              className={`pip-activity ${activity === item.id ? "selected" : ""}`}
              key={item.id}
              onClick={() => play(item.id)}
            >
              <span aria-hidden="true">{item.icon}</span>
              <strong>{item.name}</strong>
              <small>{item.hint}</small>
            </button>
          ))}
          {aiming && (
            <div className="pip-touch-buttons" aria-label="Choose a throw">
              <button onClick={() => throwBall(-1.7, 0.4)}>Throw left</button>
              <button onClick={() => throwBall(0.1, 1.4)}>Throw near</button>
              <button onClick={() => throwBall(1.7, 0.4)}>Throw right</button>
            </div>
          )}
          <details className="pip-touch-options">
            <summary>More ways to say hello</summary>
            <div className="pip-touch-buttons">
              {Object.entries(touchNames).map(([part, name]) => (
                <button key={part} onClick={() => touch(part as BodyPart)}>
                  {name}
                </button>
              ))}
            </div>
          </details>
          {activity === "bubbles" && (
            <button
              className="secondary"
              disabled={pops === 10}
              onClick={() => {
                const next = Array.from({ length: 10 }, (_, i) => i).find(
                  (i) => !popped.includes(i),
                );
                if (next !== undefined) popBubble(next);
              }}
            >
              Pop a bubble
            </button>
          )}
          <button
            className="secondary"
            onClick={() => {
              setActivity("idle");
              setAiming(false);
              setPopped([]);
              setFeedback(
                "Take your time. Pip will explore the clearing at his own pace.",
              );
            }}
          >
            Let Pip explore
          </button>
        </aside>
      </div>
      <div className="pip-play-feedback" role="status">
        {feedback}
        {pops > 0 && ` ${pops} ${pops === 1 ? "bubble" : "bubbles"} popped!`}
      </div>
      {!playful && (
        <p className="fine-print">
          Quiet motion limits movement. Touch feedback and camera controls
          remain available.
        </p>
      )}
      <p className="fine-print">
        {places[place].description} Playtime never spends or earns practice
        coins.
      </p>
    </>
  );
}
