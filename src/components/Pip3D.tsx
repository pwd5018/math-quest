import { useEffect, useRef, useState } from "react";
import { SvgFox } from "./Art";
import type { Appearance } from "../lib/appearance";
import type { PipAction } from "../lib/pipPose";
import type { PipInput } from "../lib/pipRenderer";

export default function Pip3D({
  look,
  action = "idle",
  token = 0,
  stillPreview = false,
  small = false,
  turnOffset = 0,
  turnReset = 0,
}: {
  look: Appearance;
  action?: PipAction;
  token?: number;
  stillPreview?: boolean;
  small?: boolean;
  turnOffset?: number;
  turnReset?: number;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const controller = useRef<{
    invalidate: () => void;
    dispose: () => void;
  } | null>(null);
  const input = useRef<PipInput>({
    look,
    action,
    token,
    turn: 0,
    gazeX: 0,
    gazeY: 0,
    reduced: false,
    stillPreview,
  });
  input.current = { ...input.current, look, action, token, stillPreview };
  const drag = useRef<{
    id: number;
    x: number;
    turn: number;
    moved: boolean;
  } | null>(null);
  const suppressClick = useRef(false);
  const [status, setStatus] = useState<"loading" | "ready" | "fallback">(
    "loading",
  );
  useEffect(() => {
    let cancelled = false;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const reduced = () => {
      input.current.reduced = media.matches;
      controller.current?.invalidate();
    };
    reduced();
    media.addEventListener("change", reduced);
    void import("../lib/pipRenderer")
      .then(({ mountPip }) => {
        if (cancelled || !canvas.current) return;
        try {
          controller.current = mountPip(
            canvas.current,
            () => input.current,
            () => setStatus("fallback"),
          );
          setStatus("ready");
        } catch {
          setStatus("fallback");
        }
      })
      .catch(() => {
        if (!cancelled) setStatus("fallback");
      });
    return () => {
      cancelled = true;
      media.removeEventListener("change", reduced);
      controller.current?.dispose();
      controller.current = null;
    };
  }, []);
  useEffect(() => {
    controller.current?.invalidate();
  }, [look, action, token]);
  useEffect(() => {
    input.current.turn = turnOffset;
    controller.current?.invalidate();
  }, [turnOffset, turnReset]);
  const fallback = status === "fallback";
  return (
    <span
      className={`pip-3d ${small ? "small" : ""}`}
      data-status={status}
      role="img"
      aria-label={`Pip the fox in a ${look.outfit} outfit${fallback ? " (illustrated fallback)" : " in real-time 3D"}`}
      onPointerDown={(event) => {
        if (stillPreview || fallback) return;
        drag.current = {
          id: event.pointerId,
          x: event.clientX,
          turn: input.current.turn,
          moved: false,
        };
        suppressClick.current = false;
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={(event) => {
        if (stillPreview || fallback) return;
        const rect = event.currentTarget.getBoundingClientRect();
        input.current.gazeX = Math.max(
          -1,
          Math.min(1, ((event.clientX - rect.left) / rect.width) * 2 - 1),
        );
        input.current.gazeY = Math.max(
          -1,
          Math.min(1, ((event.clientY - rect.top) / rect.height) * 2 - 1),
        );
        if (drag.current) {
          const delta = event.clientX - drag.current.x;
          if (Math.abs(delta) > 6) drag.current.moved = true;
          if (drag.current.moved)
            input.current.turn = drag.current.turn + delta * 0.012;
        }
        controller.current?.invalidate();
      }}
      onPointerUp={(event) => {
        if (drag.current?.id === event.pointerId) {
          suppressClick.current = drag.current.moved;
          drag.current = null;
          if (event.currentTarget.hasPointerCapture(event.pointerId))
            event.currentTarget.releasePointerCapture(event.pointerId);
        }
      }}
      onPointerCancel={() => {
        drag.current = null;
        suppressClick.current = true;
      }}
      onPointerLeave={() => {
        input.current.gazeX = 0;
        input.current.gazeY = 0;
        controller.current?.invalidate();
      }}
      onClickCapture={(event) => {
        if (suppressClick.current && event.detail !== 0) {
          event.stopPropagation();
          suppressClick.current = false;
        }
      }}
    >
      <canvas ref={canvas} aria-hidden="true" hidden={fallback} />
      {status !== "ready" && (
        <span className="pip-3d-fallback" aria-hidden="true">
          <SvgFox look={look} cheer={action === "cheer"} />
        </span>
      )}
      {fallback && !stillPreview && (
        <span className="pip-3d-note" aria-hidden="true">
          3D unavailable · illustrated Pip
        </span>
      )}
    </span>
  );
}
