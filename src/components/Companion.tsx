import { useRef, useState } from "react";
import { Fox } from "./Art";
import { moveNames, type Appearance } from "../lib/appearance";
import { playPipVoice } from "../lib/pipVoice";

const messages = {
  hop: "A hop, a skip, a happy Pip!",
  twirl: "Ta-da! A little fox twirl.",
  stars: "A little pocketful of stardust.",
  cheer: "You did it! Look at you grow.",
  dance: "A little shimmy, a very happy Pip!",
  wave: "Hello, my brilliant little explorer!",
};
export function Companion({
  look,
  celebrate = false,
  label = "Play with Pip",
  className = "",
}: {
  look: Appearance;
  celebrate?: boolean;
  label?: string;
  className?: string;
}) {
  const [taps, setTaps] = useState(0);
  const lastTap = useRef(-Infinity);
  const [active, setActive] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState<"quiet" | "scheduled">(
    "quiet",
  );
  const action = active ? look.move : celebrate ? "cheer" : "idle";
  const showMagic = active || celebrate;
  function play() {
    if (performance.now() - lastTap.current < 700) return;
    lastTap.current = performance.now();
    setTaps((n) => n + 1);
    setActive(true);
    if (look.voice !== "off")
      void playPipVoice(look.voice).then((played) =>
        setVoiceStatus(played ? "scheduled" : "quiet"),
      );
    else setVoiceStatus("quiet");
  }
  function lookTowardPointer(event: React.PointerEvent<HTMLButtonElement>) {
    if (
      event.pointerType !== "mouse" ||
      look.motion !== "playful" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = Math.max(
      -1,
      Math.min(1, ((event.clientX - bounds.left) / bounds.width - 0.5) * 2),
    );
    const y = Math.max(
      -1,
      Math.min(1, ((event.clientY - bounds.top) / bounds.height - 0.5) * 2),
    );
    event.currentTarget.style.setProperty("--pip-look-x", `${x * 2.5}px`);
    event.currentTarget.style.setProperty("--pip-look-y", `${y * 1.5}px`);
    event.currentTarget.style.setProperty("--pip-look-tilt", `${x * 3}deg`);
  }
  function resetLook(event: React.SyntheticEvent<HTMLButtonElement>) {
    for (const key of ["--pip-look-x", "--pip-look-y", "--pip-look-tilt"])
      event.currentTarget.style.removeProperty(key);
  }
  return (
    <div
      className={`companion ${className}`}
      data-action={action}
      data-voice={voiceStatus}
    >
      <button
        type="button"
        className="companion-button"
        aria-label={`${label}: ${moveNames[look.move]}`}
        onClick={play}
        onPointerMove={lookTowardPointer}
        onPointerLeave={resetLook}
        onBlur={resetLook}
      >
        <span
          key={`${taps}-${celebrate}`}
          className={`pip-motion pip-${action}`}
          onAnimationEnd={(e) => {
            if (e.currentTarget === e.target) setActive(false);
          }}
        >
          <Fox look={look} cheer={celebrate || active} />
          <span className="pip-contact-shadow" aria-hidden="true" />
          {showMagic && (
            <span className="pip-sparkles" aria-hidden="true">
              {Array.from({ length: 12 }, (_, i) => (
                <i
                  key={i}
                  style={
                    {
                      "--spark-angle": `${i * 30}deg`,
                      "--spark-delay": `${i * 25}ms`,
                    } as React.CSSProperties
                  }
                >
                  {i % 2 ? "✧" : "✦"}
                </i>
              ))}
            </span>
          )}
        </span>
      </button>
      <span className="companion-speech" role="status" aria-live="polite">
        {active ? messages[look.move] : celebrate ? messages.cheer : ""}
      </span>
    </div>
  );
}
