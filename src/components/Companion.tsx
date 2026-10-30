import { useEffect, useRef, useState } from "react";
import Pip3D from "./Pip3D";
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
  const [turnOffset, setTurnOffset] = useState(0);
  const [turnReset, setTurnReset] = useState(0);
  useEffect(() => {
    if (!active) return;
    const timer = window.setTimeout(() => setActive(false), 2300);
    return () => window.clearTimeout(timer);
  }, [active, taps]);
  const [voiceStatus, setVoiceStatus] = useState<"quiet" | "scheduled">(
    "quiet",
  );
  const action = active ? look.move : celebrate ? "cheer" : "idle";
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
  return (
    <div
      className={`companion ${className}`}
      data-action={action}
      data-voice={voiceStatus}
    >
      <button
        type="button"
        className="companion-button"
        aria-label={`${label}: ${moveNames[look.move]}. Drag to turn; arrow keys turn; Home faces forward.`}
        onClick={play}
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
            event.preventDefault();
            setTurnOffset(
              (value) => value + (event.key === "ArrowLeft" ? -0.35 : 0.35),
            );
          } else if (event.key === "Home") {
            event.preventDefault();
            setTurnOffset(0);
            setTurnReset((value) => value + 1);
          }
        }}
      >
        <Pip3D
          look={look}
          action={action}
          token={taps}
          turnOffset={turnOffset}
          turnReset={turnReset}
        />
      </button>
      <span className="companion-speech" role="status" aria-live="polite">
        {active ? messages[look.move] : celebrate ? messages.cheer : ""}
      </span>
    </div>
  );
}
