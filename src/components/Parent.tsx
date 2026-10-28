import { useState } from "react";
import {
  ArrowLeft,
  Check,
  Coins,
  Plus,
  Pencil,
  Archive,
  BarChart3,
  Gift,
  ClipboardCheck,
  Settings2,
  ScrollText,
  ShieldCheck,
  X,
} from "lucide-react";
import type {
  State,
  Reward,
  adjustCoins,
  resolveRequest,
} from "../lib/economy";
import { balance } from "../lib/economy";
import { skills, skillNames } from "../lib/math";
import { useDialog } from "../lib/useDialog";
import { reviseCurriculum } from "../lib/curriculum";
type Props = {
  state: State;
  update: (s: State) => Promise<boolean>;
  safely: (fn: () => State) => void;
  onLeave: () => void;
  adjust: typeof adjustCoins;
  resolve: typeof resolveRequest;
  cloud?: boolean;
  commands?: {
    reward: (reward: Reward) => Promise<boolean>;
    settings: (state: State) => Promise<boolean>;
    adjust: (amount: number, reason: string) => Promise<boolean>;
    resolve: (
      id: string,
      action: "approve" | "decline" | "fulfill",
    ) => Promise<boolean>;
  };
};
const blank: Reward = {
  id: "",
  title: "",
  description: "",
  cost: 30,
  emoji: "🎁",
  approved: true,
  archived: false,
  available: true,
  limit: 0,
};
export default function Parent({
  state,
  update,
  safely,
  onLeave,
  adjust,
  resolve,
  cloud = false,
  commands,
}: Props) {
  const [tab, setTab] = useState("overview");
  const [planDraft, setPlanDraft] = useState(() =>
    structuredClone(state.settings.curriculum),
  );
  const [settingsError, setSettingsError] = useState("");
  const [editing, setEditing] = useState<Reward | null>(null);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [saved, setSaved] = useState("");
  useDialog(!!editing, () => setEditing(null));
  const independent = state.attempts.filter((a) => a.independent).length;
  const attempted = new Set(
    state.events.filter((e) => e.kind === "answer").map((e) => e.questionId),
  ).size;
  const hintEvents = state.events.filter((e) => e.kind === "hint").length;
  const pending = state.requests.filter((r) => r.status === "pending").length;
  async function saveReward(e: React.FormEvent) {
    e.preventDefault();
    if (
      !editing ||
      !editing.title.trim() ||
      !Number.isSafeInteger(editing.cost) ||
      editing.cost < 1 ||
      !Number.isSafeInteger(editing.limit) ||
      editing.limit < 0
    )
      return;
    const reward = {
      ...editing,
      id: editing.id || crypto.randomUUID(),
      title: editing.title.trim(),
    };
    const saved = commands
      ? await commands.reward(reward)
      : await update({
          ...state,
          rewards: editing.id
            ? state.rewards.map((r) => (r.id === reward.id ? reward : r))
            : [...state.rewards, reward],
        });
    if (saved) setEditing(null);
  }
  function resolveReward(
    id: string,
    action: "approve" | "decline" | "fulfill",
  ) {
    if (commands) void commands.resolve(id, action);
    else safely(() => resolve(state, id, action, new Date().toISOString()));
  }
  return (
    <>
      <section className="page-heading">
        <div>
          <div className="eyebrow">THE GROWN-UP CORNER</div>
          <h1>A little insight. A lot of growth.</h1>
          <p>Support the journey, celebrate the effort.</p>
        </div>
        <button className="secondary" onClick={onLeave}>
          <ArrowLeft size={16} /> Student adventure
        </button>
      </section>
      <div className="notice parent-notice">
        <ShieldCheck size={20} />
        <span>
          {cloud ? (
            <>
              <strong>Verified parent access.</strong> Changes are checked by
              Firestore security rules and saved to your private family profile.
            </>
          ) : (
            <>
              <strong>Demo parent preview · no authentication.</strong> All data
              and approvals are editable in this browser. Firebase access is
              disabled until verified.
            </>
          )}
        </span>
      </div>
      <div className="parent-tabs" role="tablist" aria-label="Parent sections">
        {[
          { id: "overview", label: "Learning overview", icon: BarChart3 },
          { id: "rewards", label: "Reward inventory", icon: Gift },
          {
            id: "requests",
            label: `Requests${pending ? ` (${pending})` : ""}`,
            icon: ClipboardCheck,
          },
          { id: "ledger", label: "Coin ledger", icon: ScrollText },
          { id: "settings", label: "Learning goals", icon: Settings2 },
        ].map((t) => (
          <button
            role="tab"
            aria-selected={tab === t.id}
            key={t.id}
            onClick={() => {
              setTab(t.id);
              setSaved("");
            }}
            className={tab === t.id ? "selected" : ""}
          >
            <t.icon size={17} />
            {t.label}
          </button>
        ))}
      </div>
      {tab === "overview" && (
        <>
          <section className="panel focus-overview">
            <div>
              <span className="eyebrow">
                CURRENT LEARNING PLAN · {state.settings.curriculum.revision}
              </span>
              <h2>
                {skillNames[state.settings.curriculum.focusSkill]} takes the
                lead.
              </h2>
              <p className="muted">
                Multiplication through {state.settings.curriculum.maxFactor} ×{" "}
                {state.settings.curriculum.maxFactor} ·{" "}
                {state.settings.curriculum.mode === "adaptive"
                  ? "Gentle progression"
                  : "Full-range practice"}{" "}
                · {state.settings.curriculum.enabledSkills.length} active trail
                {state.settings.curriculum.enabledSkills.length === 1
                  ? ""
                  : "s"}
                . Permanent achievements and earlier history are kept when your
                plan changes.
              </p>
            </div>
            <button className="secondary" onClick={() => setTab("settings")}>
              Adjust learning plan <Settings2 size={16} />
            </button>
          </section>
          <div className="stat-grid">
            {[
              { value: attempted, label: "Questions attempted" },
              {
                value: attempted
                  ? `${Math.round((independent / attempted) * 100)}%`
                  : "—",
                label: "Independent accuracy",
              },
              { value: hintEvents, label: "Hint requests" },
              { value: state.sessions.length, label: "Completed adventures" },
            ].map((s) => (
              <section className="panel metric" key={s.label}>
                <strong>{s.value}</strong>
                <span>{s.label}</span>
              </section>
            ))}
          </div>
          <p className="muted metric-note">
            Independent means correct on the first try without a hint. Accuracy
            includes all attempted questions, including unfinished ones. Each
            submission and hint is saved; completion records include first
            answer and retries.
          </p>
          <section className="panel">
            <h2>Growing, one concept at a time</h2>
            <p className="muted">
              Mastery requires 8 independent advanced answers across at least 2
              adventures. Stars celebrate progress separately.
            </p>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Concept</th>
                    <th>Current trail</th>
                    <th>Independent</th>
                    <th>Needs support</th>
                    <th>Mastery evidence</th>
                  </tr>
                </thead>
                <tbody>
                  {skills.map((s) => {
                    const p = state.progress[s],
                      attempts = state.attempts.filter((a) => a.skill === s);
                    return (
                      <tr key={s}>
                        <td>
                          <strong>{skillNames[s]}</strong>
                        </td>
                        <td>{p.level} of 3</td>
                        <td>
                          {attempts.filter((a) => a.independent).length} /{" "}
                          {attempts.length}
                        </td>
                        <td>
                          {attempts.filter((a) => !a.independent).length}{" "}
                          questions
                        </td>
                        <td>
                          {p.mastered ? (
                            <span className="status approved">Mastered</span>
                          ) : (
                            `${p.advanced}/8 · ${p.advancedSessions.length}/2 adventures`
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
          <div className="parent-two">
            <section className="panel">
              <h2>Practice history</h2>
              {!state.sessions.length ? (
                <p className="empty-text">
                  Completed ten-question adventures will appear here.
                </p>
              ) : (
                state.sessions
                  .slice()
                  .reverse()
                  .slice(0, 20)
                  .map((s) => (
                    <div key={s.id} className="history-row">
                      <div>
                        <strong>
                          {skillNames[s.skill as keyof typeof skillNames]}
                        </strong>
                        <small>{new Date(s.at).toLocaleString()}</small>
                        {s.plan && (
                          <small>
                            Plan {s.plan.revision}
                            {s.skill === "multiplication"
                              ? ` · Through ${s.plan.maxFactor} × ${s.plan.maxFactor}`
                              : ""}
                          </small>
                        )}
                      </div>
                      <span>
                        {s.independent}/10 independent
                        <br />
                        <small>+{s.coins} coins</small>
                      </span>
                    </div>
                  ))
              )}
            </section>
            <section className="panel">
              <h2>Opportunities to grow</h2>
              {!state.attempts.some((a) => !a.independent) ? (
                <p className="empty-text">
                  After practice, tricky concepts and supported answers will
                  appear here.
                </p>
              ) : (
                state.attempts
                  .filter((a) => !a.independent)
                  .slice(-8)
                  .reverse()
                  .map((a) => (
                    <div className="history-row" key={a.id}>
                      <div>
                        <strong>
                          {a.question.a} {a.question.symbol} {a.question.b} ={" "}
                          {a.question.answer}
                        </strong>
                        <small>
                          First answer: {a.firstAnswer} · {a.hints} hints ·{" "}
                          {a.wrongAnswers} retries
                        </small>
                      </div>
                      <span className="status pending">Practice together</span>
                    </div>
                  ))
              )}
            </section>
          </div>
          <section className="panel">
            <h2>Recent question evidence</h2>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Question</th>
                    <th>First answer</th>
                    <th>Hints / retries</th>
                    <th>Result</th>
                    <th>When</th>
                  </tr>
                </thead>
                <tbody>
                  {state.attempts
                    .slice(-20)
                    .reverse()
                    .map((a) => (
                      <tr key={a.id}>
                        <td>
                          {a.question.a} {a.question.symbol} {a.question.b} ={" "}
                          {a.question.answer}
                        </td>
                        <td>{a.firstAnswer}</td>
                        <td>
                          {a.hints} / {a.wrongAnswers}
                        </td>
                        <td>
                          {a.independent ? "Independent" : "With support"}
                        </td>
                        <td>{new Date(a.at).toLocaleString()}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
              {!state.attempts.length && (
                <p className="empty-text">
                  Start an adventure to collect learning evidence.
                </p>
              )}
            </div>
          </section>
        </>
      )}
      {tab === "overview" && state.events.length > 0 && (
        <section className="panel">
          <h2>Submission and hint history</h2>
          <p className="muted">
            Includes unfinished questions, so every attempt to learn has a
            place.
          </p>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Question</th>
                  <th>Action</th>
                  <th>Answer</th>
                  <th>When</th>
                </tr>
              </thead>
              <tbody>
                {state.events
                  .slice(-30)
                  .reverse()
                  .map((event, index) => (
                    <tr key={`${event.sessionId}-${index}`}>
                      <td>
                        {event.question.a} {event.question.symbol}{" "}
                        {event.question.b}
                      </td>
                      <td>
                        {event.kind === "hint"
                          ? "Hint requested"
                          : event.correct
                            ? "Correct answer"
                            : "Try again"}
                      </td>
                      <td>{event.answer ?? "—"}</td>
                      <td>{new Date(event.at).toLocaleString()}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
      {tab === "rewards" && (
        <>
          <div className="section-heading">
            <div>
              <h2>Lovely things to work toward</h2>
              <p className="muted">
                Only approved, unarchived rewards appear in the student shop.
              </p>
            </div>
            <button
              className="primary"
              onClick={() => setEditing({ ...blank })}
            >
              <Plus size={17} /> Add reward
            </button>
          </div>
          <div className="inventory-list">
            {state.rewards.map((r) => (
              <section
                className={`panel inventory-item ${r.archived ? "archived" : ""}`}
                key={r.id}
              >
                <span className="inventory-emoji">{r.emoji}</span>
                <div>
                  <h3>{r.title}</h3>
                  <p>{r.description}</p>
                  <div className="inventory-meta">
                    <span>{r.cost} coins</span>
                    <span>
                      {r.archived
                        ? "Archived"
                        : !r.approved
                          ? "Not approved"
                          : r.available
                            ? "Available"
                            : "Unavailable"}
                    </span>
                    <span>
                      {r.limit ? `${r.limit} total request(s)` : "Repeatable"}
                    </span>
                  </div>
                </div>
                <div className="button-row">
                  <button
                    className="secondary"
                    onClick={() => setEditing({ ...r })}
                  >
                    <Pencil size={15} /> Edit
                  </button>
                  <button
                    className="icon-button"
                    aria-label={`${r.archived ? "Restore" : "Archive"} ${r.title}`}
                    onClick={() =>
                      commands
                        ? commands.reward({ ...r, archived: !r.archived })
                        : update({
                            ...state,
                            rewards: state.rewards.map((x) =>
                              x.id === r.id
                                ? { ...x, archived: !x.archived }
                                : x,
                            ),
                          })
                    }
                  >
                    {r.archived ? <Plus size={18} /> : <Archive size={18} />}
                  </button>
                </div>
              </section>
            ))}
          </div>
        </>
      )}
      {tab === "requests" && (
        <section className="panel">
          <h2>From little efforts to lovely memories</h2>
          <p className="muted">
            A request reserves its exact cost. Decline a pending or approved
            request to refund it. Fulfilled rewards are final.
          </p>
          {!state.requests.length ? (
            <div className="empty-state">
              <Gift size={34} />
              <p>
                No requests yet. They’ll appear when your explorer chooses a
                treasure.
              </p>
            </div>
          ) : (
            state.requests
              .slice()
              .reverse()
              .map((r) => (
                <div className="parent-request" key={r.id}>
                  <span className="inventory-emoji">
                    {state.rewards.find((x) => x.id === r.rewardId)?.emoji ||
                      "🎁"}
                  </span>
                  <div>
                    <h3>{r.title}</h3>
                    <p>
                      {r.cost} coins reserved ·{" "}
                      {new Date(r.at).toLocaleString()}
                    </p>
                    <span className={`status ${r.status}`}>
                      {r.status === "declined"
                        ? "Declined · refunded"
                        : r.status}
                    </span>
                  </div>
                  <div className="button-row">
                    {r.status === "pending" && (
                      <button
                        className="primary"
                        onClick={() => resolveReward(r.id, "approve")}
                      >
                        <Check size={15} /> Approve
                      </button>
                    )}
                    {r.status === "approved" && (
                      <button
                        className="primary"
                        onClick={() => resolveReward(r.id, "fulfill")}
                      >
                        Mark fulfilled
                      </button>
                    )}
                    {(r.status === "pending" || r.status === "approved") && (
                      <button
                        className="secondary"
                        onClick={() => resolveReward(r.id, "decline")}
                      >
                        Decline & refund
                      </button>
                    )}
                  </div>
                </div>
              ))
          )}
        </section>
      )}
      {tab === "ledger" && (
        <>
          <section className="panel ledger-adjust">
            <div>
              <h2>
                <Coins size={23} /> {balance(state)} coins available
              </h2>
              <p className="muted">
                Manual awards are separate from the daily practice limit. Every
                adjustment needs a reason.
              </p>
            </div>
            <form
              className="adjust-form"
              onSubmit={async (e) => {
                e.preventDefault();
                if (commands) {
                  if (!(await commands.adjust(Number(amount), reason))) return;
                } else
                  safely(() =>
                    adjust(
                      state,
                      Number(amount),
                      reason,
                      crypto.randomUUID(),
                      new Date().toISOString(),
                    ),
                  );
                setAmount("");
                setReason("");
              }}
            >
              <label>
                Coin adjustment
                <input
                  required
                  type="number"
                  step="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 10 or -5"
                />
              </label>
              <label>
                Reason
                <input
                  required
                  maxLength={200}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Celebrating extra perseverance"
                />
              </label>
              <button className="primary">Save adjustment</button>
            </form>
          </section>
          <section className="panel">
            <h2>Every coin has a story</h2>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>When</th>
                    <th>Reason</th>
                    <th>Coins</th>
                    <th>Reference</th>
                  </tr>
                </thead>
                <tbody>
                  {state.ledger
                    .slice()
                    .reverse()
                    .map((l) => (
                      <tr key={l.id}>
                        <td>{new Date(l.at).toLocaleString()}</td>
                        <td>{l.reason}</td>
                        <td className={l.amount > 0 ? "positive" : ""}>
                          {l.amount > 0 ? "+" : ""}
                          {l.amount}
                        </td>
                        <td className="ledger-reference">
                          {l.reference?.slice(0, 14) || "Parent adjustment"}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
              {!state.ledger.length && (
                <p className="empty-text">
                  The adventure starts at zero. Practice to earn your first
                  coins.
                </p>
              )}
            </div>
          </section>
        </>
      )}
      {tab === "settings" && (
        <section className="panel settings-panel">
          <h2>A rhythm that works for your family</h2>
          <p className="muted">
            Goals encourage consistency without timers, penalties, or losing
            earned achievements.
          </p>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const data = new FormData(e.currentTarget);
              try {
                const curriculum = reviseCurriculum(
                  state.settings.curriculum,
                  planDraft,
                );
                const next = {
                  ...state,
                  nickname: String(data.get("nickname")).trim() || "Explorer",
                  settings: {
                    curriculum,
                    dailyCap: Number(data.get("cap")),
                    weeklySessions: Number(data.get("goal")),
                  },
                };
                const savedOk = commands
                  ? await commands.settings(next)
                  : await update(next);
                if (savedOk) {
                  setPlanDraft(curriculum);
                  setSettingsError("");
                  setSaved(
                    `Learning plan ${curriculum.revision} saved${cloud ? " to your family cloud profile" : " on this device"}. It applies to the next adventure; an active adventure keeps its original plan.`,
                  );
                }
              } catch (error) {
                setSettingsError((error as Error).message);
                setSaved("");
              }
            }}
          >
            <section className="learning-plan-editor">
              <span className="eyebrow">
                LEARNING PLAN · REVISION {state.settings.curriculum.revision}
              </span>
              <h3>What are we exploring?</h3>
              <p>
                Start with multiplication through 12 × 12. Change the focus,
                range or active trails here; no code changes needed.
              </p>
              <fieldset>
                <legend>Active math trails</legend>
                <div className="skill-choices">
                  {skills.map((skill) => (
                    <label className="checkbox" key={skill}>
                      <input
                        type="checkbox"
                        checked={planDraft.enabledSkills.includes(skill)}
                        onChange={(e) => {
                          const enabled = e.target.checked
                            ? [...planDraft.enabledSkills, skill]
                            : planDraft.enabledSkills.filter(
                                (s) => s !== skill,
                              );
                          setPlanDraft({
                            ...planDraft,
                            enabledSkills: enabled,
                            focusSkill: enabled.includes(planDraft.focusSkill)
                              ? planDraft.focusSkill
                              : (enabled[0] ?? planDraft.focusSkill),
                          });
                          setSaved("");
                        }}
                      />
                      {skillNames[skill]}
                    </label>
                  ))}
                </div>
              </fieldset>
              <label>
                Main learning focus
                <select
                  value={planDraft.focusSkill}
                  onChange={(e) => {
                    setPlanDraft({
                      ...planDraft,
                      focusSkill: e.target.value as typeof planDraft.focusSkill,
                    });
                    setSaved("");
                  }}
                >
                  {planDraft.enabledSkills.map((skill) => (
                    <option key={skill} value={skill}>
                      {skillNames[skill]}
                    </option>
                  ))}
                </select>
                <small>
                  The map highlights this trail, and Let’s go starts it by
                  default.
                </small>
              </label>
              <label>
                Multiplication fact limit
                <select
                  value={planDraft.maxFactor}
                  onChange={(e) => {
                    setPlanDraft({
                      ...planDraft,
                      maxFactor: Number(e.target.value),
                    });
                    setSaved("");
                  }}
                >
                  {[5, 6, 7, 8, 9, 10, 11, 12].map((max) => (
                    <option key={max} value={max}>
                      Through {max} × {max}
                    </option>
                  ))}
                </select>
                <small>
                  Both factors stay within this limit. Division retains its
                  third-grade facts through 10 × 10.
                </small>
              </label>
              <label>
                Multiplication difficulty
                <select
                  value={planDraft.mode}
                  onChange={(e) => {
                    setPlanDraft({
                      ...planDraft,
                      mode: e.target.value as typeof planDraft.mode,
                    });
                    setSaved("");
                  }}
                >
                  <option value="adaptive">
                    Gentle progression — start small and grow
                  </option>
                  <option value="full-range">
                    Practice the full selected range right away
                  </option>
                </select>
                <small>
                  Gentle progression starts with small groups, then expands
                  after three independent answers in a row. Existing progress is
                  kept.
                </small>
              </label>
              <div className="plan-preview">
                <strong>Next adventure</strong>
                <span>
                  {skillNames[planDraft.focusSkill]} ·{" "}
                  {planDraft.enabledSkills.length} active trail
                  {planDraft.enabledSkills.length === 1 ? "" : "s"} ·
                  Multiplication through {planDraft.maxFactor} ×{" "}
                  {planDraft.maxFactor}
                </span>
                <p>
                  10 distinct fact families. Less-practiced facts come first;
                  tricky facts return on review turns after a gap. Swapped
                  multiplication facts share history.
                </p>
              </div>
              <p className="muted">
                Saving a changed plan increments its revision. The same seed,
                plan and learning history always produce the same question
                sequence. Coins and permanent achievements are never reset.
              </p>
            </section>
            <label>
              Explorer nickname
              <input
                name="nickname"
                required
                maxLength={24}
                defaultValue={state.nickname}
              />
              <small>A nickname only. No full name or birthday needed.</small>
            </label>
            <label>
              Weekly adventure goal
              <input
                name="goal"
                required
                type="number"
                min="1"
                max="14"
                step="1"
                defaultValue={state.settings.weeklySessions}
              />
            </label>
            <label>
              Daily practice coin limit
              <input
                name="cap"
                required
                type="number"
                min="0"
                max="200"
                step="1"
                defaultValue={state.settings.dailyCap}
              />
              <small>
                Also limited to five rewarded questions per skill and difficulty
                per UTC day. A supported answer earns 1 coin; an independent
                answer earns 3.
              </small>
            </label>
            <button className="primary">
              Save learning plan & goals <Check size={17} />
            </button>
            {settingsError && (
              <p className="settings-error" role="alert">
                {settingsError}
              </p>
            )}
            {saved && (
              <p className="positive" role="status">
                {saved}
              </p>
            )}
          </form>
        </section>
      )}
      {editing && (
        <div className="modal-backdrop">
          <section
            className="modal reward-editor"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-title"
          >
            <button
              className="modal-close icon-button"
              aria-label="Close editor"
              onClick={() => setEditing(null)}
            >
              <X />
            </button>
            <h2 id="edit-title">
              {editing.id ? "Edit a treasure" : "A new little treasure"}
            </h2>
            <form onSubmit={saveReward}>
              <div className="form-two">
                <label>
                  Symbol
                  <input
                    maxLength={8}
                    value={editing.emoji}
                    onChange={(e) =>
                      setEditing({ ...editing, emoji: e.target.value })
                    }
                  />
                </label>
                <label>
                  Coin cost
                  <input
                    type="number"
                    required
                    min="1"
                    max="10000"
                    step="1"
                    value={editing.cost || ""}
                    onChange={(e) =>
                      setEditing({ ...editing, cost: Number(e.target.value) })
                    }
                  />
                </label>
              </div>
              <label>
                Reward name
                <input
                  autoFocus
                  required
                  maxLength={60}
                  value={editing.title}
                  onChange={(e) =>
                    setEditing({ ...editing, title: e.target.value })
                  }
                />
              </label>
              <label>
                A little description
                <textarea
                  maxLength={180}
                  value={editing.description}
                  onChange={(e) =>
                    setEditing({ ...editing, description: e.target.value })
                  }
                />
              </label>
              <label>
                Total request limit
                <input
                  type="number"
                  min="0"
                  step="1"
                  required
                  value={editing.limit}
                  onChange={(e) =>
                    setEditing({ ...editing, limit: Number(e.target.value) })
                  }
                />
                <small>
                  0 means repeatable. Counts pending, approved and fulfilled
                  requests.
                </small>
              </label>
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={editing.approved}
                  onChange={(e) =>
                    setEditing({ ...editing, approved: e.target.checked })
                  }
                />{" "}
                Parent approved for the student shop
              </label>
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={editing.available}
                  onChange={(e) =>
                    setEditing({ ...editing, available: e.target.checked })
                  }
                />{" "}
                Currently available
              </label>
              <button className="primary">
                Save treasure <Check size={17} />
              </button>
            </form>
          </section>
        </div>
      )}
    </>
  );
}
