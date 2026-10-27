import {
  Sparkles,
  Palette,
  CloudSun,
  WandSparkles,
  Heart,
  Check,
  ArrowRight,
  Volume2,
} from "lucide-react";
import { useState } from "react";
import { Companion } from "./Companion";
import { Fox } from "./Art";
import { Atmosphere } from "./Illustrations";
import { playPipVoice } from "../lib/pipVoice";
import {
  outfitNames,
  accentColors,
  hatNames,
  moveNames,
  type Appearance,
} from "../lib/appearance";

export default function PipStudio({
  look,
  onChange,
  onExplore,
}: {
  look: Appearance;
  onChange: (next: Appearance) => void;
  onExplore: () => void;
}) {
  const [voiceMessage, setVoiceMessage] = useState("");
  function choose<K extends keyof Appearance>(key: K, value: Appearance[K]) {
    onChange({ ...look, [key]: value });
  }
  return (
    <>
      <section className="page-heading">
        <div>
          <div className="eyebrow">A LITTLE IMAGINATION LOOKS GOOD ON YOU</div>
          <h1>Pip’s little dressing room</h1>
          <p>A new look. A silly move. A world that feels like yours.</p>
        </div>
        <span className="free-play-chip">
          <Heart size={15} /> All yours to explore
        </span>
      </section>
      <div className="studio-layout">
        <aside className="studio-preview" data-outfit={look.outfit}>
          <div className={`pip-stage sky-${look.sky}`}>
            <div className="stage-sun" />
            <span className="stage-cloud cloud-one" />
            <span className="stage-cloud cloud-two" />
            <span className="stage-star star-one">✧</span>
            <span className="stage-star star-two">✦</span>
            <div className="stage-hill hill-back" />
            <div className="stage-hill hill-front" />
            <div className="stage-plinth" />
            <div className="stage-portal" aria-hidden="true" />
            <div className="stage-orbit" aria-hidden="true" />
            <Atmosphere className="studio-atmosphere" />
            <Companion
              key={look.move}
              look={look}
              label="Try Pip’s special move"
              className="studio-pip"
            />
            <span className="stage-flower flower-one">✿</span>
            <span className="stage-flower flower-two">✿</span>
          </div>
          <div className="studio-preview-caption">
            <span className="little-label">YOUR VERY OWN ADVENTURE BUDDY</span>
            <h2>
              Hello,{" "}
              {look.outfit === "wizard"
                ? "Professor "
                : look.outfit === "astronaut"
                  ? "Captain "
                  : ""}
              Pip!
            </h2>
            <p>
              Click or tap Pip to try{" "}
              <strong>{moveNames[look.move].toLowerCase()}</strong>.
            </p>
            <span className="studio-save-note">
              <Check size={13} /> Your choices save on this device.
            </span>
          </div>
          <button className="primary" onClick={onExplore}>
            Back to our adventure <ArrowRight size={16} />
          </button>
        </aside>
        <div className="studio-controls">
          <div className="studio-pocket-preview">
            <Companion
              key={look.move}
              look={look}
              label="Try pocket Pip’s move"
            />
            <div>
              <strong>{outfitNames[look.outfit]}</strong>
              <p>Tap Pip to try {moveNames[look.move].toLowerCase()}.</p>
            </div>
          </div>
          <section className="panel studio-panel">
            <div className="studio-section-title">
              <Palette size={20} />
              <div>
                <h2>Today, Pip is a…</h2>
                <p>Every adventure starts with a little make-believe.</p>
              </div>
            </div>
            <div className="outfit-grid">
              {(Object.keys(outfitNames) as Appearance["outfit"][]).map(
                (outfit) => (
                  <button
                    type="button"
                    key={outfit}
                    className={`outfit-choice ${look.outfit === outfit ? "selected" : ""}`}
                    aria-pressed={look.outfit === outfit}
                    aria-label={outfitNames[outfit]}
                    onClick={() => choose("outfit", outfit)}
                  >
                    <span className="outfit-thumbnail" aria-hidden="true">
                      <Fox look={{ ...look, outfit }} />
                    </span>
                    <strong>{outfitNames[outfit]}</strong>
                    {look.outfit === outfit && (
                      <span className="choice-check">
                        <Check size={12} />
                      </span>
                    )}
                  </button>
                ),
              )}
            </div>
            <fieldset className="color-fieldset">
              <legend>A favorite splash of color</legend>
              <div className="color-choices">
                {(Object.keys(accentColors) as Appearance["accent"][]).map(
                  (accent) => (
                    <button
                      type="button"
                      key={accent}
                      className={`color-choice ${look.accent === accent ? "selected" : ""}`}
                      aria-pressed={look.accent === accent}
                      aria-label={`${accent} accent`}
                      onClick={() => choose("accent", accent)}
                    >
                      <span style={{ background: accentColors[accent] }}>
                        {look.accent === accent && <Check size={16} />}
                      </span>
                      <small>{accent}</small>
                    </button>
                  ),
                )}
              </div>
            </fieldset>
            <fieldset className="hat-fieldset">
              <legend>A little something on top</legend>
              <div className="hat-choices">
                {(Object.keys(hatNames) as Appearance["hat"][]).map((hat) => (
                  <button
                    type="button"
                    key={hat}
                    className={`secondary ${look.hat === hat ? "selected" : ""}`}
                    aria-pressed={look.hat === hat}
                    onClick={() => choose("hat", hat)}
                  >
                    <span aria-hidden="true">
                      {hat === "none"
                        ? "🦊"
                        : hat === "cap"
                          ? "🧢"
                          : hat === "crown"
                            ? "👑"
                            : "🌼"}
                    </span>
                    {hatNames[hat]}
                  </button>
                ))}
              </div>
            </fieldset>
            <label className="glasses-toggle">
              <span>
                <strong>Some very clever glasses</strong>
                <small>For spotting wonderful little details.</small>
              </span>
              <input
                type="checkbox"
                checked={look.glasses}
                onChange={(e) => choose("glasses", e.target.checked)}
              />
            </label>
          </section>
          <section className="panel studio-panel">
            <div className="studio-section-title">
              <WandSparkles size={20} />
              <div>
                <h2>A signature little move</h2>
                <p>Tap Pip anywhere you spot a play button.</p>
              </div>
            </div>
            <div className="move-choices">
              {(Object.keys(moveNames) as Appearance["move"][]).map((move) => (
                <button
                  type="button"
                  key={move}
                  className={`move-choice ${look.move === move ? "selected" : ""}`}
                  aria-pressed={look.move === move}
                  onClick={() => choose("move", move)}
                >
                  <span aria-hidden="true">
                    {move === "hop"
                      ? "↟"
                      : move === "twirl"
                        ? "↻"
                        : move === "stars"
                          ? "✧"
                          : move === "dance"
                            ? "♫"
                            : "☞"}
                  </span>
                  <strong>{moveNames[move]}</strong>
                  <small>
                    {move === "hop"
                      ? "A bouncy little hello"
                      : move === "twirl"
                        ? "A spin and a tail swish"
                        : move === "stars"
                          ? "A sprinkle of wonder"
                          : move === "dance"
                            ? "A toe-tapping little party"
                            : "A wave just for you"}
                  </small>
                </button>
              ))}
            </div>
          </section>
          <section className="panel studio-panel voice-panel">
            <div className="studio-section-title">
              <Volume2 size={20} />
              <div>
                <h2>A teeny-tiny voice</h2>
                <p>A little “wee-yip!” when you click your buddy.</p>
              </div>
            </div>
            <label>
              Pip’s squeak
              <select
                value={look.voice}
                onChange={(e) => {
                  choose("voice", e.target.value as Appearance["voice"]);
                  setVoiceMessage("");
                }}
              >
                <option value="soft">Soft little squeak</option>
                <option value="chirpy">Extra chirpy</option>
                <option value="off">Quiet Pip — sound off</option>
              </select>
              <small>
                Sound plays only when you tap Pip or try the voice. The speaker
                button at the top mutes it anytime.
              </small>
            </label>
            <button
              type="button"
              className="secondary voice-preview-button"
              disabled={look.voice === "off"}
              onClick={() => {
                void playPipVoice(look.voice).then((ok) =>
                  setVoiceMessage(
                    ok
                      ? "A tiny squeak, just for you."
                      : "Pip is taking a quiet moment. Try again shortly or check your browser sound setting.",
                  ),
                );
              }}
            >
              <Volume2 size={16} /> Try Pip’s voice
            </button>
            {voiceMessage && (
              <p className="voice-preview-message" role="status">
                {voiceMessage}
              </p>
            )}
          </section>
          <section className="panel studio-panel">
            <div className="studio-section-title">
              <CloudSun size={20} />
              <div>
                <h2>What’s the sky feeling?</h2>
                <p>
                  A sunny morning, a golden evening, or a little stargazing.
                </p>
              </div>
            </div>
            <div className="sky-choices">
              {(
                [
                  { id: "day", name: "Sunny day", icon: "☀" },
                  { id: "sunset", name: "Peachy sunset", icon: "◒" },
                  { id: "starlight", name: "Starlight", icon: "☾" },
                ] as const
              ).map((sky) => (
                <button
                  type="button"
                  key={sky.id}
                  className={`sky-choice sky-${sky.id} ${look.sky === sky.id ? "selected" : ""}`}
                  aria-pressed={look.sky === sky.id}
                  onClick={() => choose("sky", sky.id)}
                >
                  <span aria-hidden="true">{sky.icon}</span>
                  <strong>{sky.name}</strong>
                </button>
              ))}
            </div>
            <label className="motion-select">
              A comfy amount of motion
              <select
                value={look.motion}
                onChange={(e) =>
                  choose("motion", e.target.value as Appearance["motion"])
                }
              >
                <option value="playful">
                  Playful — wandering Pip and a gently moving world
                </option>
                <option value="calm">
                  Calm — a quiet world, with small celebration wiggles
                </option>
                <option value="still">
                  Still — lovely looks and cheers without movement
                </option>
              </select>
              <small>
                You can change this anytime. Your device’s reduced-motion
                setting always comes first.
              </small>
            </label>
            <p className="system-motion-note">
              Your device asks for reduced motion, so Pip and the landscape will
              stay still.
            </p>
          </section>
          <div className="studio-kind-note">
            <Sparkles size={18} />
            <p>
              Every look and move is free. Dressing up never spends your reward
              coins or changes your learning plan.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
