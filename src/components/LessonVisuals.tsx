import type { Lesson, ModelState, Example } from "../lib/lessons";

export function Berry() {
  return (
    <svg className="lesson-berry" viewBox="0 0 40 44" aria-hidden="true">
      <path
        d="M6 15C-1 27 15 43 20 43S41 27 34 15C30 7 11 7 6 15Z"
        fill="#db6273"
      />
      <path d="M8 17c2-7 11-7 11-7l-3 12Z" fill="#ed92a0" />
      <path d="m20 13-11-7 9 1 3-7 3 8 10-2-8 9Z" fill="#538969" />
      {[
        [12, 24],
        [22, 20],
        [29, 27],
        [18, 32],
        [24, 36],
      ].map(([x, y]) => (
        <ellipse
          key={`${x}-${y}`}
          cx={x}
          cy={y}
          rx="1"
          ry="1.6"
          fill="#ffe2aa"
        />
      ))}
    </svg>
  );
}
export function ArrayPicture({ example }: { example: Example }) {
  return (
    <div
      className="lesson-array"
      role="img"
      aria-label={`${example.groups} rows, ${example.each} columns, ${example.groups * example.each} berries altogether.`}
    >
      {Array.from({ length: example.groups }, (_, i) => (
        <div key={i} className="lesson-array-row">
          <span>Row {i + 1}</span>
          {Array.from({ length: example.each }, (_, j) => (
            <Berry key={j} />
          ))}
        </div>
      ))}
    </div>
  );
}
export function GroupsPicture({
  example,
  revealed = example.groups,
}: {
  example: Example;
  revealed?: number;
}) {
  return (
    <div className="picnic-groups">
      {Array.from({ length: example.groups }, (_, i) => (
        <div
          className="picnic-blanket"
          key={i}
          role="img"
          aria-label={`Group ${i + 1}, ${i < revealed ? example.each : 0} berries`}
        >
          <strong>Group {i + 1}</strong>
          <div className="berry-spaces">
            {Array.from({ length: example.each }, (_, j) => (
              <span className="berry-space" key={j}>
                {i < revealed ? (
                  <Berry />
                ) : (
                  <span className="berry-placeholder" />
                )}
              </span>
            ))}
          </div>
          <small>
            {i < revealed
              ? `${example.each} in this group`
              : "Waiting for its group"}
          </small>
        </div>
      ))}
    </div>
  );
}
export function NumberLine({
  groups,
  each,
  jumps,
  onLand,
  disabled = false,
}: {
  groups: number;
  each: number;
  jumps: number[];
  onLand?: (n: number) => void;
  disabled?: boolean;
}) {
  const total = groups * each;
  return (
    <div className="lesson-numberline">
      <div className="jump-summary" aria-live="polite">
        {jumps.length - 1} of {groups} jumps · At {jumps.at(-1)}
      </div>
      <div
        className="jump-track"
        aria-label={`Number line from zero to ${total + each}`}
      >
        {Array.from({ length: total + each + 1 }, (_, n) => (
          <button
            key={n}
            className={jumps.includes(n) ? "landed" : ""}
            aria-label={`Land on ${n}`}
            aria-pressed={jumps.includes(n)}
            disabled={disabled || !onLand}
            onClick={() => onLand?.(n)}
          >
            {n}
          </button>
        ))}
      </div>
      <p className="fine-print">
        {jumps.join(" → ")} · Each jump adds {each}.
      </p>
    </div>
  );
}
export function LessonModel({
  lesson,
  state,
  onChange,
  locked,
  message,
}: {
  lesson: Lesson;
  state: ModelState;
  onChange: (next: ModelState) => void;
  locked: boolean;
  message: (text: string) => void;
}) {
  const { groups, each } = lesson.example,
    total = groups * each;
  if (lesson.model === "addition")
    return (
      <>
        <GroupsPicture example={lesson.example} />
        <div className="addition-builder">
          {state.terms.map((term, i) => (
            <label key={i}>
              Group {i + 1} adds
              <select
                aria-label={`Addend for group ${i + 1}`}
                disabled={locked}
                value={term}
                onChange={(e) =>
                  onChange({
                    ...state,
                    terms: state.terms.map((n, j) =>
                      i === j ? Number(e.target.value) : n,
                    ),
                  })
                }
              >
                <option value={0}>Choose</option>
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <option key={n}>{n}</option>
                ))}
              </select>
              {i < groups - 1 && <span aria-hidden="true">+</span>}
            </label>
          ))}
          <strong>= {state.terms.reduce((a, b) => a + b, 0)}</strong>
        </div>
      </>
    );
  if (lesson.model === "jumps")
    return (
      <>
        <NumberLine
          groups={groups}
          each={each}
          jumps={state.jumps}
          disabled={locked}
          onLand={(n) => {
            const expected = state.jumps.at(-1)! + each;
            if (state.jumps.length > groups) return;
            if (n !== expected) {
              message(
                `Each jump is ${each}. From ${state.jumps.at(-1)}, add ${each} to find the next landing.`,
              );
              return;
            }
            onChange({ ...state, jumps: [...state.jumps, n] });
          }}
        />
        <button
          className="secondary"
          disabled={locked || state.jumps.length === 1}
          onClick={() =>
            onChange({ ...state, jumps: state.jumps.slice(0, -1) })
          }
        >
          Undo a jump
        </button>
      </>
    );
  if (lesson.model === "array")
    return (
      <>
        <div className="array-controls">
          {(["rows", "columns"] as const).map((key) => (
            <div key={key}>
              <strong>
                {key === "rows" ? "Rows (across)" : "Columns (down)"}:{" "}
                {state[key]}
              </strong>
              <div>
                <button
                  className="secondary"
                  aria-label={`Remove a ${key === "rows" ? "row" : "column"}`}
                  disabled={locked || state[key] === 1}
                  onClick={() => onChange({ ...state, [key]: state[key] - 1 })}
                >
                  −
                </button>
                <button
                  className="secondary"
                  aria-label={`Add a ${key === "rows" ? "row" : "column"}`}
                  disabled={locked || state[key] === 6}
                  onClick={() => onChange({ ...state, [key]: state[key] + 1 })}
                >
                  +
                </button>
              </div>
            </div>
          ))}
        </div>
        <ArrayPicture example={{ groups: state.rows, each: state.columns }} />
        <p className="lesson-equation">
          {state.rows} × {state.columns} = {state.rows * state.columns}
        </p>
      </>
    );
  if (lesson.model === "equation")
    return (
      <>
        <GroupsPicture example={lesson.example} />
        <div className="equation-roles">
          {["Total berries", "Number of groups", "Berries in each group"].map(
            (label, i) => (
              <label key={label}>
                {label}
                <select
                  aria-label={label}
                  value={state.roles[i]}
                  disabled={locked}
                  onChange={(e) =>
                    onChange({
                      ...state,
                      roles: state.roles.map((n, j) =>
                        j === i ? Number(e.target.value) : n,
                      ),
                    })
                  }
                >
                  <option value={0}>Choose</option>
                  {[...new Set([groups, each, total, 2, 6])]
                    .sort((a, b) => a - b)
                    .map((n) => (
                      <option key={n}>{n}</option>
                    ))}
                </select>
              </label>
            ),
          )}
        </div>
        <p className="lesson-equation">
          {state.roles[0] || "?"} ÷ {state.roles[1] || "?"} ={" "}
          {state.roles[2] || "?"}
        </p>
      </>
    );
  const finite = lesson.subject === "division",
    packed = state.counts.reduce((a, b) => a + b, 0),
    packing = lesson.model === "packing",
    rows = lesson.model === "division-array";
  function change(i: number, delta: number) {
    if (
      locked ||
      (delta > 0 && (state.counts[i] >= 6 || (finite && packed >= total)))
    )
      return;
    onChange({
      ...state,
      counts: state.counts.map((n, j) =>
        j === i ? Math.max(0, n + delta) : n,
      ),
    });
  }
  return (
    <>
      <div className="berry-basket">
        <Berry />
        <strong>
          {finite
            ? `${total - packed} left in the basket`
            : `${packed} berries placed`}
        </strong>
        <span>
          {packing
            ? `Each basket must hold ${each}. How many baskets?`
            : rows
              ? `${groups} equal rows`
              : `${groups} equal blankets`}
        </span>
      </div>
      {packing && (
        <div className="lesson-control-row">
          <button
            className="secondary"
            disabled={locked || state.counts.length === 6}
            onClick={() => onChange({ ...state, counts: [...state.counts, 0] })}
          >
            Add a basket
          </button>
          <button
            className="secondary"
            disabled={locked || state.counts.length === 1}
            onClick={() => {
              onChange({ ...state, counts: state.counts.slice(0, -1) });
              message("The last basket’s berries went back into the supply.");
            }}
          >
            Remove last basket
          </button>
        </div>
      )}
      <div className={rows ? "division-row-model" : "picnic-groups"}>
        {state.counts.map((count, i) => (
          <div
            key={i}
            className={rows ? "division-berry-row" : "picnic-blanket"}
            role="group"
            aria-label={`${packing ? "Basket" : rows ? "Row" : "Blanket"} ${i + 1}, ${count} ${count === 1 ? "berry" : "berries"}`}
          >
            <strong>
              {packing ? "Basket" : rows ? "Row" : "Blanket"} {i + 1}
            </strong>
            <div className="berry-spaces">
              {Array.from({ length: 6 }, (_, j) =>
                j < count ? (
                  <button
                    key={j}
                    className="berry-space"
                    disabled={locked}
                    aria-label={`Return berry ${j + 1} from group ${i + 1}`}
                    onClick={() => change(i, -1)}
                  >
                    <Berry />
                  </button>
                ) : (
                  <span className="berry-space" key={j}>
                    <span className="berry-placeholder" />
                  </span>
                ),
              )}
            </div>
            <span>
              {count} {count === 1 ? "berry" : "berries"}
            </span>
            <button
              className="secondary"
              aria-label={`Add a berry to group ${i + 1}`}
              disabled={locked || count === 6 || (finite && packed === total)}
              onClick={() => change(i, 1)}
            >
              + Add a berry
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
