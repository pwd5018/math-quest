import { useState } from "react";
import type { Question } from "../lib/math";
import { numberHop } from "../lib/practiceTools";

/** Mounted only after a saved hint or wrong answer; never changes answer/economy state. */
export default function MathTools({ question: q }: { question: Question }) {
  const [cells, setCells] = useState<number[]>([]);
  const [view, setView] = useState<"groups" | "array">("groups");
  const [rounds, setRounds] = useState(0);
  const [hops, setHops] = useState<
    { position: number; distance: number; moved: number }[]
  >([]);
  const moved = hops.at(-1)?.moved ?? 0;
  const position = hops.at(-1)?.position ?? q.a;
  const hopSizes = [
    ...new Set(
      [1, 10, 100]
        .filter((size) => size === 1 || q.b >= size)
        .map((size) => (moved === q.b ? size : Math.min(size, q.b - moved))),
    ),
  ];
  const reset = () => {
    setCells([]);
    setRounds(0);
    setHops([]);
  };
  return (
    <section className="math-workbench" aria-label="Hands-on math tools">
      <div className="tool-heading">
        <strong>Try it with your hands</strong>
        <button type="button" className="tool-button" onClick={reset}>
          Start over
        </button>
      </div>
      {q.skill === "multiplication" ? (
        <>
          <p>
            Build {q.a} groups of {q.b}. Tap gems to count, or fill a whole
            group. Swipe sideways to see long rows.
          </p>
          <div
            className="tool-actions"
            role="group"
            aria-label="Choose a model"
          >
            <button
              type="button"
              className="tool-button"
              aria-pressed={view === "groups"}
              onClick={() => setView("groups")}
            >
              Equal groups
            </button>
            <button
              type="button"
              className="tool-button"
              aria-pressed={view === "array"}
              onClick={() => setView("array")}
            >
              Array
            </button>
            <button
              type="button"
              className="tool-button"
              disabled={cells.length === q.a * q.b}
              onClick={() => {
                const row = Array.from({ length: q.a }, (_, r) => r).find((r) =>
                  Array.from({ length: q.b }, (_, c) => r * q.b + c).some(
                    (i) => !cells.includes(i),
                  ),
                );
                if (row !== undefined)
                  setCells([
                    ...new Set([
                      ...cells,
                      ...Array.from({ length: q.b }, (_, c) => row * q.b + c),
                    ]),
                  ]);
              }}
            >
              Fill next group
            </button>
          </div>
          <div className={`gem-model gem-model-${view}`}>
            {Array.from({ length: q.a }, (_, row) => (
              <div
                className="gem-row"
                key={row}
                role="group"
                aria-label={`Group ${row + 1}`}
              >
                <span className="gem-row-label">{row + 1}</span>
                {Array.from({ length: q.b }, (_, col) => {
                  const id = row * q.b + col;
                  return (
                    <button
                      type="button"
                      key={id}
                      className="counting-gem"
                      aria-label={`Group ${row + 1}, gem ${col + 1}`}
                      aria-pressed={cells.includes(id)}
                      onClick={() =>
                        setCells(
                          cells.includes(id)
                            ? cells.filter((i) => i !== id)
                            : [...cells, id],
                        )
                      }
                    >
                      <span aria-hidden="true">◆</span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
          <p className="tool-result" role="status">
            {cells.length} {cells.length === 1 ? "gem" : "gems"} counted
            {cells.length === q.a * q.b
              ? ` · ${q.a} equal groups of ${q.b}!`
              : " · Keep building."}
          </p>
        </>
      ) : q.skill === "division" ? (
        <>
          <p>
            Share {q.a} gems among {q.b} adventurers. Give each adventurer one
            gem per round.
          </p>
          <div className="sharing-model">
            {Array.from({ length: q.b }, (_, i) => (
              <div className="sharing-basket" key={i}>
                <strong>Friend {i + 1}</strong>
                <div aria-hidden="true">
                  {Array.from({ length: rounds }, (_, j) => (
                    <span key={j}>◆</span>
                  ))}
                </div>
                <span>
                  {rounds} {rounds === 1 ? "gem" : "gems"}
                </span>
              </div>
            ))}
          </div>
          <div className="tool-actions">
            <button
              type="button"
              className="tool-button"
              disabled={rounds * q.b >= q.a}
              onClick={() => setRounds(rounds + 1)}
            >
              Share one round
            </button>
            <button
              type="button"
              className="tool-button"
              disabled={!rounds}
              onClick={() => setRounds(rounds - 1)}
            >
              Undo a round
            </button>
          </div>
          <p className="tool-result" role="status">
            {q.a - rounds * q.b} gems left to share · {rounds} in each group
            {rounds * q.b === q.a ? " · Everyone has an equal share!" : ""}
          </p>
        </>
      ) : (
        <>
          <p>
            Start at {q.a}. Hop {q.b}{" "}
            {q.skill === "addition" ? "forward" : "backward"}. Choose small hops
            or bundles of ten and a hundred.
          </p>
          <div className="hop-track" aria-label="Your number-line journey">
            <span>
              {q.a}
              <small>Start</small>
            </span>
            {hops.map((hop, i) => (
              <span key={i}>
                <small>
                  {q.skill === "addition" ? "+" : "−"}
                  {hop.distance} →
                </small>
                {hop.position}
              </span>
            ))}
          </div>
          <div className="tool-actions">
            {hopSizes.map((size) => (
              <button
                type="button"
                className="tool-button"
                key={size}
                disabled={moved === q.b}
                onClick={() => setHops([...hops, numberHop(q, moved, size)])}
              >
                Hop {Math.min(size, q.b - moved) || size}
              </button>
            ))}
            <button
              type="button"
              className="tool-button"
              disabled={!hops.length}
              onClick={() => setHops(hops.slice(0, -1))}
            >
              Undo hop
            </button>
          </div>
          <p className="tool-result" role="status">
            You’re at {position} · {q.b - moved} left to hop
            {moved === q.b ? " · You reached the end!" : ""}
          </p>
        </>
      )}
      <p className="tool-note">
        Use what you discover to type your answer above. Tools are part of
        supported practice.
      </p>
    </section>
  );
}
