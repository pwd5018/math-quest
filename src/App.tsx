import { useEffect, useRef, useState } from "react";
import {
  Map,
  BookOpen,
  ShoppingBag,
  Award,
  ArrowRight,
  Star,
  Coins,
  ChevronRight,
  LockKeyhole,
  X,
  Check,
  Sparkles,
  Flame,
  Flag,
  Heart,
  Lightbulb,
  CircleHelp,
  ShieldCheck,
  CheckCircle2,
  Menu,
  Shirt,
  Pause,
  Play,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Fox, Landscape } from "./components/Art";
import {
  generateQuestion,
  checkAnswer,
  skillNames,
  type Skill,
} from "./lib/math";
import { advance, type Attempt } from "./lib/learning";
import {
  awardFor,
  balance,
  requestReward,
  resolveRequest,
  adjustCoins,
  type State,
  type Reward,
} from "./lib/economy";
import { loadState, saveState } from "./lib/storage";
import Parent from "./components/Parent";
import { useDialog } from "./lib/useDialog";
import { selectQuestion, type Curriculum } from "./lib/curriculum";
import { Companion } from "./components/Companion";
import PipStudio from "./components/PipStudio";
import { changeAppearance } from "./lib/appearance";
import { stopPipVoice } from "./lib/pipVoice";
import {
  Atmosphere,
  RewardArtwork,
  SkillMedal,
} from "./components/Illustrations";

type Page = "map" | "practice" | "shop" | "badges" | "parent" | "studio";
type Run = {
  id: string;
  skill: Skill;
  seed: number;
  index: number;
  correct: number;
  coins: number;
  finished: boolean;
  plan: Curriculum;
  question: ReturnType<typeof generateQuestion>;
  asked: ReturnType<typeof generateQuestion>[];
};
const regions = [
  {
    skill: "addition" as Skill,
    name: "Sunshine Meadow",
    label: "A bright beginning",
    icon: "+",
    x: 21,
    y: 63,
  },
  {
    skill: "subtraction" as Skill,
    name: "Mushroom Grove",
    label: "Find your way forward",
    icon: "−",
    x: 39,
    y: 39,
  },
  {
    skill: "multiplication" as Skill,
    name: "Mountain Peaks",
    label: "Great things in groups",
    icon: "×",
    x: 57,
    y: 63,
  },
  {
    skill: "division" as Skill,
    name: "Treasure Cove",
    label: "Share the adventure",
    icon: "÷",
    x: 77,
    y: 44,
  },
];
const uid = () => crypto.randomUUID();
const now = () => new Date().toISOString();
export default function App() {
  const [loaded] = useState(loadState);
  const [state, setState] = useState(loaded.state);
  const [page, setPage] = useState<Page>("map");
  const [toast, setToast] = useState(loaded.warning || "");
  const [parentGate, setParentGate] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [run, setRun] = useState<Run | null>(null);
  const [answer, setAnswer] = useState("");
  const [first, setFirst] = useState("");
  const [hints, setHints] = useState(0);
  const [wrongs, setWrongs] = useState(0);
  const [feedback, setFeedback] = useState<"wrong" | "right" | null>(null);
  const [earned, setEarned] = useState(0);
  const successRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (state.appearance.voice === "off") stopPipVoice();
  }, [state.appearance.voice]);
  useEffect(() => {
    if (feedback === "right")
      successRef.current?.scrollIntoView({
        block: "nearest",
        behavior:
          state.appearance.motion === "playful" &&
          !window.matchMedia("(prefers-reduced-motion: reduce)").matches
            ? "smooth"
            : "auto",
      });
  }, [feedback, state.appearance.motion]);
  const [confirmReward, setConfirmReward] = useState<Reward | null>(null);
  useDialog(parentGate || !!confirmReward, () => {
    setParentGate(false);
    setConfirmReward(null);
  });
  function update(next: State) {
    try {
      saveState(next);
      setState(next);
      return true;
    } catch {
      setToast(
        "Your browser could not save this change. Please allow local storage and try again.",
      );
      return false;
    }
  }
  function safely(fn: () => State) {
    try {
      update(fn());
    } catch (e) {
      setToast((e as Error).message);
    }
  }
  function navigate(next: Page) {
    setPage(next);
    setMobileNav(false);
    window.scrollTo(0, 0);
  }
  function start(skill: Skill = state.settings.curriculum.focusSkill) {
    if (!state.settings.curriculum.enabledSkills.includes(skill)) {
      setToast(
        "Your grown-up has paused this trail. Explore your active learning focus instead.",
      );
      return;
    }
    const id = uid(),
      seed = Date.now() % 10000000;
    const plan = structuredClone(state.settings.curriculum);
    const question = selectQuestion({
      skill,
      level: state.progress[skill].level,
      seed,
      index: 0,
      sessionId: id,
      plan,
      events: state.events,
      asked: [],
    });
    setRun({
      id,
      skill,
      seed,
      index: 0,
      correct: 0,
      coins: 0,
      finished: false,
      plan,
      question,
      asked: [question],
    });
    setAnswer("");
    setFirst("");
    setHints(0);
    setWrongs(0);
    setFeedback(null);
    navigate("practice");
  }
  const q = run && !run.finished ? run.question : null;
  // Freeze the current question after recording, so advancing difficulty cannot change its explanation.
  const [solvedQuestion, setSolvedQuestion] = useState<typeof q>(null);
  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!q || !run || feedback === "right" || !/^\d+$/.test(answer.trim()))
      return;
    const event = {
      questionId: q.id,
      sessionId: run.id,
      question: { a: q.a, b: q.b, symbol: q.symbol, skill: q.skill },
      kind: "answer" as const,
      answer,
      correct: checkAnswer(q, answer),
      at: now(),
    };
    if (!checkAnswer(q, answer)) {
      update({ ...state, events: [...state.events, event] });
      if (!first) setFirst(answer);
      setWrongs((w) => w + 1);
      setFeedback("wrong");
      return;
    }
    const attempt: Attempt = {
      id: q.id,
      sessionId: run.id,
      skill: run.skill,
      level: q.level,
      question: q,
      firstAnswer: first || answer,
      independent: wrongs === 0 && hints === 0,
      hints,
      wrongAnswers: wrongs,
      at: now(),
      coins: 0,
    };
    attempt.coins = awardFor(state, attempt);
    const next = {
      ...state,
      events: [...state.events, event],
      attempts: [...state.attempts, attempt],
      progress: {
        ...state.progress,
        [run.skill]: advance(state.progress[run.skill], attempt),
      },
      ledger: attempt.coins
        ? [
            ...state.ledger,
            {
              id: `earn-${q.id}`,
              amount: attempt.coins,
              reason: `${skillNames[run.skill]} practice${attempt.independent ? "" : " · perseverance"}`,
              at: attempt.at,
              reference: q.id,
            },
          ]
        : state.ledger,
    };
    try {
      saveState(next);
    } catch {
      setToast(
        "Unable to save your answer. Allow local storage and try again.",
      );
      return;
    }
    setState(next);
    setSolvedQuestion(q);
    setEarned(attempt.coins);
    setFeedback("right");
    setRun({
      ...run,
      correct: run.correct + Number(attempt.independent),
      coins: run.coins + attempt.coins,
    });
  }
  function nextQuestion() {
    if (!run) return;
    if (run.index === 9) {
      const next = {
        ...state,
        sessions: [
          ...state.sessions,
          {
            id: run.id,
            skill: run.skill,
            at: now(),
            independent: run.correct,
            coins: run.coins,
            plan: run.plan,
            seed: run.seed,
          },
        ],
      };
      update(next);
      setRun({ ...run, finished: true });
    } else {
      const question = selectQuestion({
        skill: run.skill,
        level: state.progress[run.skill].level,
        seed: run.seed,
        index: run.index + 1,
        sessionId: run.id,
        plan: run.plan,
        events: state.events,
        asked: run.asked,
      });
      setRun({
        ...run,
        index: run.index + 1,
        question,
        asked: [...run.asked, question],
      });
      setAnswer("");
      setFirst("");
      setHints(0);
      setWrongs(0);
      setFeedback(null);
      setSolvedQuestion(null);
    }
  }
  const stars = Object.values(state.progress).reduce((n, p) => n + p.stars, 0);
  const focus = regions.find(
    (r) => r.skill === state.settings.curriculum.focusSkill,
  )!;
  const goal = state.rewards.find(
    (r) => r.id === state.goalId && !r.archived && r.approved,
  );
  const goalProgress = goal
    ? Math.min(100, (balance(state) / goal.cost) * 100)
    : 0;
  const weekSessions = state.sessions.filter(
    (s) => Date.now() - new Date(s.at).getTime() < 7 * 86400000,
  ).length;
  const nav = [
    { id: "map", icon: Map, name: "My adventure" },
    { id: "practice", icon: BookOpen, name: "Practice trail" },
    { id: "shop", icon: ShoppingBag, name: "Treasure shop" },
    { id: "badges", icon: Award, name: "My achievements" },
    { id: "studio", icon: Shirt, name: "Pip’s dressing room" },
  ] as const;
  if (import.meta.env.VITE_APP_MODE === "firebase")
    return (
      <main className="setup-screen">
        <ShieldCheck size={48} />
        <h1>Firebase setup required</h1>
        <p>
          Live mode is intentionally locked until authentication, authoritative
          functions, and access rules have been deployed and verified. Follow
          the repository’s Firebase setup guide.
        </p>
        <p>Set VITE_APP_MODE=demo to explore the local demo.</p>
      </main>
    );
  return (
    <div
      className="app-shell"
      data-motion={state.appearance.motion}
      data-sky={state.appearance.sky}
    >
      <a className="skip-link" href="#main-content">
        Skip to adventure
      </a>
      <aside
        id="adventure-sidebar"
        className={`sidebar ${mobileNav ? "open" : ""}`}
      >
        <a
          href="#"
          className="brand"
          onClick={(e) => {
            e.preventDefault();
            navigate("map");
          }}
        >
          <span className="brand-mark">
            <Sparkles size={23} />
          </span>
          <span>
            math<span className="brand-light">quest</span>
            <span className="brand-dot">.</span>
          </span>
        </a>
        <div className="profile">
          <div className="profile-avatar">
            <Fox small look={state.appearance} />
          </div>
          <div>
            <strong>Hey, {state.nickname}!</strong>
            <span>Every little step counts.</span>
          </div>
        </div>
        <div className="nav-label">LET’S EXPLORE</div>
        <nav aria-label="Main navigation">
          {nav.map(({ id, icon: Icon, name }) => (
            <button
              key={id}
              className={`nav-item ${page === id ? "active" : ""}`}
              onClick={() =>
                id === "practice"
                  ? run
                    ? navigate("practice")
                    : start()
                  : navigate(id)
              }
            >
              <Icon size={20} />
              <span>{name}</span>
              {page === id && <span className="active-dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="pip-note">
            <Companion
              look={state.appearance}
              className="sidebar-companion"
              label="Play with sidebar Pip"
            />
            <div>
              <strong>You’ve got this!</strong>
              <p>Big adventures start with a little curiosity.</p>
            </div>
          </div>
          <button className="parent-link" onClick={() => setParentGate(true)}>
            <LockKeyhole size={16} /> Grown-up corner <ChevronRight size={15} />
          </button>
          <div className="local-note">
            <span /> LOCAL DEMO · SAVED ON THIS DEVICE
          </div>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <button
            className="mobile-menu icon-button"
            aria-label="Toggle navigation"
            aria-expanded={mobileNav}
            aria-controls="adventure-sidebar"
            onClick={() => setMobileNav(!mobileNav)}
          >
            <Menu />
          </button>
          <div className="breadcrumb">
            <span className="breadcrumb-long">YOUR LEARNING ADVENTURE</span>
            <span className="breadcrumb-short">LET’S EXPLORE</span>{" "}
            <span>✦</span> <span className="grade">GRADE 3</span>
          </div>
          <span className="demo-mode">
            DEMO <span>· THIS DEVICE ONLY</span>
          </span>
          <div className="header-stats">
            <span className="star-stat">
              <Star size={18} fill="currentColor" />
              {stars}
              <span className="stat-label">stars</span>
            </span>
            <span className="coin-stat">
              <span className="coin-icon">◆</span>
              {balance(state)}
              <span className="stat-label">coins</span>
            </span>
            <button
              type="button"
              className="icon-button voice-toggle"
              aria-label={
                state.appearance.voice === "off"
                  ? "Turn on Pip’s voice"
                  : "Mute Pip’s voice"
              }
              title={
                state.appearance.voice === "off"
                  ? "Turn on Pip’s voice"
                  : "Mute Pip’s voice"
              }
              aria-pressed={state.appearance.voice !== "off"}
              onClick={() =>
                safely(() =>
                  changeAppearance(state, {
                    ...state.appearance,
                    voice: state.appearance.voice === "off" ? "soft" : "off",
                  }),
                )
              }
            >
              {state.appearance.voice === "off" ? (
                <VolumeX size={18} />
              ) : (
                <Volume2 size={18} />
              )}
            </button>
            <button
              className="help-button"
              aria-label="About demo mode"
              onClick={() =>
                setToast(
                  "Local demo: progress is stored only in this browser. Parent tools simulate approvals and are not securely authenticated. No account or child information is sent to a server.",
                )
              }
            >
              <CircleHelp size={21} />
            </button>
          </div>
        </header>
        <main id="main-content" tabIndex={-1}>
          {page === "map" && (
            <>
              <section className="page-heading">
                <div>
                  <div className="eyebrow">
                    A LITTLE PRACTICE. A BIG ADVENTURE.
                  </div>
                  <h1>Where will math take you?</h1>
                  <p>Your next discovery is just a few questions away.</p>
                </div>
                <div className="day-pill">
                  <span>☀</span> A good day to explore
                </div>
              </section>
              <div className="adventure-grid">
                <div className="map-column">
                  <section className="map-card">
                    <div className="map-card-heading">
                      <div>
                        <span className="little-label">YOUR WORLD</span>
                        <h2>The Wonderwood Isles</h2>
                      </div>
                      <span className="chapter-tag">YOUR LITTLE WORLD</span>
                    </div>
                    <div className="map-viewport">
                      <Landscape />
                      <Atmosphere className="map-atmosphere" />
                      <div className="sky-orb" aria-hidden="true" />
                      <span className="sky-orb-label" aria-hidden="true">
                        {state.appearance.sky === "starlight"
                          ? "a little moonlit magic"
                          : state.appearance.sky === "sunset"
                            ? "a golden kind of adventure"
                            : "a little sunshine & wonder"}
                      </span>
                      <div className="map-wanderer">
                        <Companion
                          look={state.appearance}
                          className="map-pip"
                          label="Play with map Pip"
                        />
                      </div>
                      <div className="map-cloud-label">
                        a world of possibilities
                      </div>
                      {regions.map((r, i) => (
                        <button
                          key={r.skill}
                          className={`map-stop stop-${i} ${r.skill === focus.skill ? "focused" : ""}`}
                          disabled={
                            !state.settings.curriculum.enabledSkills.includes(
                              r.skill,
                            )
                          }
                          style={{ left: `${r.x}%`, top: `${r.y}%` }}
                          onClick={() => start(r.skill)}
                          aria-label={`Explore ${r.name}: ${skillNames[r.skill]}`}
                        >
                          <span className="map-node">
                            {r.skill === focus.skill && (
                              <span className="you-marker">YOUR FOCUS</span>
                            )}
                            <span>{r.icon}</span>
                          </span>
                          <strong>{r.name}</strong>
                          <small>
                            {!state.settings.curriculum.enabledSkills.includes(
                              r.skill,
                            )
                              ? "Paused by parent"
                              : r.skill === "multiplication"
                                ? `Facts through ${state.settings.curriculum.maxFactor} × ${state.settings.curriculum.maxFactor}`
                                : skillNames[r.skill]}
                          </small>
                          <div className="node-stars">
                            {[0, 1, 2].map((s) => (
                              <Star
                                key={s}
                                size={13}
                                fill={
                                  state.progress[r.skill].stars > s
                                    ? "#edb64c"
                                    : "#ffffff90"
                                }
                                strokeWidth={1.5}
                              />
                            ))}
                          </div>
                        </button>
                      ))}
                      <div className="map-compass">
                        N<span>✥</span>
                      </div>
                    </div>
                    <div className="map-play-footer">
                      <span>
                        <Sparkles size={13} /> Psst… tap Pip for a little
                        surprise.
                      </span>
                      <div className="map-play-actions">
                        <button
                          type="button"
                          className="icon-button map-motion-toggle"
                          aria-label={
                            state.appearance.motion === "playful"
                              ? "Pause world motion"
                              : "Resume playful motion"
                          }
                          title={
                            state.appearance.motion === "playful"
                              ? "Pause world motion"
                              : "Resume playful motion"
                          }
                          aria-pressed={state.appearance.motion !== "playful"}
                          onClick={() =>
                            safely(() =>
                              changeAppearance(state, {
                                ...state.appearance,
                                motion:
                                  state.appearance.motion === "playful"
                                    ? "calm"
                                    : "playful",
                              }),
                            )
                          }
                        >
                          {state.appearance.motion === "playful" ? (
                            <Pause size={15} />
                          ) : (
                            <Play size={15} />
                          )}
                        </button>
                        <button
                          className="text-link"
                          onClick={() => navigate("studio")}
                        >
                          <Shirt size={14} /> Dress up Pip{" "}
                          <ArrowRight size={13} />
                        </button>
                      </div>
                    </div>
                    <div className="map-footer">
                      <span>
                        <span className="legend-dot" />{" "}
                        {skillNames[focus.skill]} is your learning focus
                      </span>
                      <span>
                        Go at your own pace <Heart size={13} />
                      </span>
                    </div>
                  </section>
                  <section className="continue-card">
                    <div className="continue-symbol">{focus.icon}</div>
                    <div>
                      <div className="little-label">
                        YOUR NEXT LITTLE ADVENTURE
                      </div>
                      <h2>
                        {focus.skill === "multiplication"
                          ? "Big discoveries, one fact at a time."
                          : `Let’s explore ${focus.name}.`}
                      </h2>
                      <p>
                        {focus.skill === "multiplication"
                          ? `Grow your multiplication skills through ${state.settings.curriculum.maxFactor} × ${state.settings.curriculum.maxFactor}.`
                          : `Explore ${skillNames[focus.skill].toLowerCase()} in ${focus.name}.`}
                      </p>
                      <span className="practice-details">
                        <BookOpen size={13} /> 10 questions <span>·</span> No
                        timer. Just you and your curiosity.
                      </span>
                    </div>
                    <button className="primary" onClick={() => start()}>
                      Let’s go <ArrowRight size={17} />
                    </button>
                  </section>
                </div>
                <aside className="right-rail">
                  <section className="quest-card">
                    <div className="section-top">
                      <span className="icon-tile">
                        <Flag size={19} />
                      </span>
                      <span className="little-label">YOUR WEEKLY QUEST</span>
                      <Sparkles size={16} />
                    </div>
                    <h2>
                      Small steps,
                      <br /> super discoveries.
                    </h2>
                    <p>
                      Finish {state.settings.weeklySessions} practice adventures
                      this week.
                      <br />A little practice goes a long way!
                    </p>
                    <div className="quest-steps">
                      {Array.from(
                        { length: state.settings.weeklySessions },
                        (_, i) => (
                          <span
                            className={weekSessions > i ? "complete" : ""}
                            key={i}
                          >
                            {weekSessions > i ? (
                              <Check size={17} />
                            ) : (
                              <Star size={16} />
                            )}
                          </span>
                        ),
                      )}
                    </div>
                    <div className="progress-caption">
                      <strong>
                        {Math.min(weekSessions, state.settings.weeklySessions)}{" "}
                        of {state.settings.weeklySessions} adventures
                      </strong>
                      <span>You can do it!</span>
                    </div>
                  </section>
                  <section className="savings-card">
                    <div className="section-top">
                      <span className="little-label">
                        SAVING FOR SOMETHING SPECIAL
                      </span>
                      <Heart size={16} />
                    </div>
                    <div className="reward-illustration">
                      <RewardArtwork symbol={goal?.emoji || "✨"} />
                    </div>
                    <h3>{goal?.title || "Your next big smile"}</h3>
                    <p>
                      {goal
                        ? "Little efforts. Lovely memories."
                        : "Choose a goal in the treasure shop."}
                    </p>
                    <div className="progress-track">
                      <span style={{ width: `${goalProgress}%` }} />
                    </div>
                    <div className="progress-caption">
                      <strong>
                        <Coins size={14} /> {balance(state)}{" "}
                        <span>/ {goal?.cost || "—"} coins</span>
                      </strong>
                      <span>{Math.round(goalProgress)}%</span>
                    </div>
                    <button
                      className="text-link"
                      onClick={() => navigate("shop")}
                    >
                      Visit the treasure shop <ArrowRight size={15} />
                    </button>
                  </section>
                </aside>
              </div>
              <section className="encouragement">
                <span className="encouragement-icon">
                  <Lightbulb size={21} />
                </span>
                <div>
                  <strong>It’s okay to not know… yet.</strong>
                  <span>
                    Take your time, try a hint, and keep going. That’s how your
                    math brain grows!
                  </span>
                </div>
                <span className="little-doodle">✧</span>
              </section>
            </>
          )}
          {page === "practice" && run && (
            <>
              <section className="page-heading">
                <div>
                  <div className="eyebrow">
                    {regions
                      .find((r) => r.skill === run.skill)
                      ?.name.toUpperCase()}
                  </div>
                  <h1>
                    {run.finished
                      ? "Look how far you’ve come!"
                      : "A little wonder. A little math."}
                  </h1>
                  <p>
                    {run.finished
                      ? "Every question was a step forward."
                      : "Take your time. Pip is here to help."}
                  </p>
                </div>
                <button className="secondary" onClick={() => navigate("map")}>
                  <Map size={17} /> Back to map
                </button>
              </section>
              {run.finished ? (
                <section className="session-summary">
                  <div className="celebration">
                    <span className="celebration-medal">
                      <SkillMedal symbol="✦" unlocked />
                    </span>
                    <Companion
                      look={state.appearance}
                      celebrate
                      label="Play with celebrating Pip"
                    />
                    <span className="celebration-medal">
                      <SkillMedal symbol="✧" unlocked />
                    </span>
                  </div>
                  <div className="eyebrow">ADVENTURE COMPLETE</div>
                  <h2>You kept going. That’s wonderful.</h2>
                  <p>
                    10 questions explored · {run.correct} answered independently
                  </p>
                  <div className="summary-stats">
                    <span>
                      <Coins /> +{run.coins} coins
                    </span>
                    <span>
                      <Star /> {state.progress[run.skill].stars} permanent stars
                    </span>
                  </div>
                  <p>
                    Hints help you learn. Independent answers help show what you
                    know.
                  </p>
                  <div className="button-row">
                    <button
                      className="primary"
                      onClick={() => navigate("shop")}
                    >
                      Peek at your treasures <ShoppingBag size={17} />
                    </button>
                    <button
                      className="secondary"
                      onClick={() => navigate("map")}
                    >
                      Explore the map
                    </button>
                  </div>
                </section>
              ) : (
                q && (
                  <div className="practice-layout">
                    <section className="question-card">
                      <div className="question-top">
                        <span>
                          {skillNames[run.skill]} · Trail {q.level}
                          {run.skill === "multiplication" &&
                            ` · Up to ${run.plan.maxFactor} × ${run.plan.maxFactor}`}
                        </span>
                        <strong>{run.index + 1} / 10</strong>
                      </div>
                      <div className="question-progress">
                        {Array.from({ length: 10 }, (_, i) => (
                          <span
                            key={i}
                            className={
                              i < run.index
                                ? "done"
                                : i === run.index
                                  ? "current"
                                  : ""
                            }
                          />
                        ))}
                      </div>
                      <div className="question-body">
                        <span className="question-label">
                          {q.story
                            ? "A LITTLE STORY TO SOLVE"
                            : "WHAT DO YOU DISCOVER?"}
                        </span>
                        {q.story && (
                          <p className="word-problem">
                            {(feedback === "right" ? solvedQuestion : q)?.story}
                          </p>
                        )}
                        <div className="equation">
                          {(feedback === "right" ? solvedQuestion : q)?.a}{" "}
                          <span>{q.symbol}</span>{" "}
                          {(feedback === "right" ? solvedQuestion : q)?.b}{" "}
                          <span>=</span> <span className="answer-box">?</span>
                        </div>
                        <form onSubmit={submit}>
                          <label htmlFor="answer">Your answer</label>
                          <div className="answer-row">
                            <input
                              key={`${run.id}-${run.index}`}
                              autoFocus
                              id="answer"
                              inputMode="numeric"
                              autoComplete="off"
                              value={answer}
                              onChange={(e) => setAnswer(e.target.value)}
                              disabled={feedback === "right"}
                              placeholder="Type a number"
                            />
                            <button
                              className="primary"
                              disabled={
                                feedback === "right" ||
                                !/^\d+$/.test(answer.trim())
                              }
                            >
                              Check answer <ArrowRight size={17} />
                            </button>
                          </div>
                        </form>
                        <button
                          className="hint-button"
                          disabled={feedback === "right"}
                          onClick={() => {
                            setHints((h) => h + 1);
                            update({
                              ...state,
                              events: [
                                ...state.events,
                                {
                                  questionId: q.id,
                                  sessionId: run.id,
                                  question: {
                                    a: q.a,
                                    b: q.b,
                                    symbol: q.symbol,
                                    skill: q.skill,
                                  },
                                  kind: "hint",
                                  at: now(),
                                },
                              ],
                            });
                          }}
                        >
                          <Lightbulb size={17} />
                          {hints
                            ? "Show the hint again"
                            : "A little hint, please"}
                        </button>
                        {(hints > 0 || feedback === "wrong") &&
                          feedback !== "right" && (
                            <div className="hint-panel">
                              <strong>
                                {feedback === "wrong"
                                  ? "A good try! Let’s look another way."
                                  : "Let’s work it out together."}
                              </strong>
                              <p>{q.hint}</p>
                              <Manipulative question={q} />
                              {wrongs >= 2 && (
                                <p className="worked-example">
                                  <strong>Worked example:</strong>{" "}
                                  {q.explanation} Try typing the answer to
                                  practice it.
                                </p>
                              )}
                            </div>
                          )}
                        {feedback === "right" && (
                          <div
                            className="success-panel"
                            aria-live="polite"
                            ref={successRef}
                          >
                            <div className="success-heading">
                              <CheckCircle2 size={24} />
                              <strong>
                                {wrongs || hints
                                  ? "You worked it out!"
                                  : "You found it!"}
                              </strong>
                              <span className="earned-coins" key={q.id}>
                                <Coins size={17} /> +{earned}
                              </span>
                            </div>
                            <div className="answer-celebration">
                              <Companion
                                key={q.id}
                                look={state.appearance}
                                celebrate
                                label="Play with cheering Pip"
                              />
                              <div>
                                <strong>
                                  {wrongs || hints
                                    ? "That’s the spirit!"
                                    : "A little victory dance!"}
                                </strong>
                                <span>Pip’s cheering for you.</span>
                              </div>
                            </div>
                            <p>{solvedQuestion?.explanation}</p>
                            {earned === 0 && (
                              <p>
                                You’ve reached this trail’s coin limit for
                                today. Your learning and stars still grow!
                              </p>
                            )}
                            <button className="primary" onClick={nextQuestion}>
                              {run.index === 9
                                ? "Finish adventure"
                                : "On to the next discovery"}{" "}
                              <ArrowRight size={17} />
                            </button>
                          </div>
                        )}
                      </div>
                    </section>
                    <aside className="practice-pip">
                      <Companion
                        look={state.appearance}
                        label="Play with practice Pip"
                      />
                      <h3>You’re growing your math brain.</h3>
                      <p>
                        There’s no race here. Use a hint, draw it out, or try a
                        different way.
                      </p>
                      <p className="fine-print">
                        Learning plan {run.plan.revision} ·{" "}
                        {run.plan.mode === "adaptive"
                          ? "Gentle progression"
                          : "Full multiplication range"}
                        . Parent changes apply to your next adventure.
                      </p>
                      <div className="practice-pocket">
                        <Coins size={20} />
                        <strong>{run.coins} coins earned</strong>
                        <span>on this adventure</span>
                      </div>
                      <p className="fine-print">
                        Up to {state.settings.dailyCap} practice coins per day.
                        Up to 5 rewarded questions per skill and difficulty each
                        day.
                      </p>
                    </aside>
                  </div>
                )
              )}
            </>
          )}
          {page === "shop" && (
            <>
              <section className="page-heading">
                <div>
                  <div className="eyebrow">
                    LITTLE EFFORTS. LOVELY MEMORIES.
                  </div>
                  <h1>The treasure shop</h1>
                  <p>Save for something special, chosen by your grown-up.</p>
                </div>
                <span className="large-balance">
                  <Coins size={22} />
                  {balance(state)} <small>coins to spend</small>
                </span>
              </section>
              <div className="notice">
                <ShieldCheck size={19} />
                <span>
                  These are seeded, parent-approved demo rewards. Requests
                  reserve coins and wait for demo parent approval.
                </span>
              </div>
              <div className="reward-grid">
                {state.rewards
                  .filter((r) => r.approved && !r.archived)
                  .map((r) => {
                    const used = state.requests.filter(
                      (req) =>
                        req.rewardId === r.id && req.status !== "declined",
                    ).length;
                    const unavailable =
                      !r.available || (r.limit > 0 && used >= r.limit);
                    return (
                      <section
                        className={`reward-card reward-${r.id}`}
                        key={r.id}
                      >
                        <div className="shop-art">
                          <RewardArtwork symbol={r.emoji} />
                        </div>
                        <div className="reward-card-body">
                          {state.goalId === r.id && (
                            <span className="goal-chip">
                              <Heart size={12} /> MY SAVINGS GOAL
                            </span>
                          )}
                          <h2>{r.title}</h2>
                          <p>{r.description}</p>
                          <strong className="reward-cost">
                            <Coins size={18} />
                            {r.cost} coins
                          </strong>
                          <button
                            className="primary"
                            disabled={unavailable || balance(state) < r.cost}
                            onClick={() => setConfirmReward(r)}
                          >
                            {unavailable
                              ? "Currently unavailable"
                              : balance(state) < r.cost
                                ? `${r.cost - balance(state)} more coins to go`
                                : "Request this treasure"}
                            <ArrowRight size={16} />
                          </button>
                          <button
                            className="text-link"
                            onClick={() => update({ ...state, goalId: r.id })}
                          >
                            {state.goalId === r.id
                              ? "Your savings goal ✓"
                              : "Save for this treasure"}
                          </button>
                        </div>
                      </section>
                    );
                  })}
              </div>
              <section className="panel requests-panel">
                <h2>Your treasure requests</h2>
                <p className="muted">
                  Your coins are reserved when you request. Declined requests
                  are fully refunded.
                </p>
                {!state.requests.length ? (
                  <div className="empty-state">
                    <ShoppingBag size={28} />
                    <p>Your next lovely memory starts here.</p>
                  </div>
                ) : (
                  state.requests
                    .slice()
                    .reverse()
                    .map((r) => (
                      <div className="request-row" key={r.id}>
                        <span className="request-emoji">
                          <RewardArtwork
                            symbol={
                              state.rewards.find((x) => x.id === r.rewardId)
                                ?.emoji || "🎁"
                            }
                          />
                        </span>
                        <div>
                          <strong>{r.title}</strong>
                          <small>
                            {r.cost} coins ·{" "}
                            {new Date(r.at).toLocaleDateString()}
                          </small>
                        </div>
                        <span className={`status ${r.status}`}>
                          {r.status === "declined"
                            ? "Declined · refunded"
                            : r.status === "pending"
                              ? "Waiting for grown-up"
                              : r.status}
                        </span>
                      </div>
                    ))
                )}
              </section>
            </>
          )}
          {page === "badges" && (
            <>
              <section className="page-heading">
                <div>
                  <div className="eyebrow">LOOK AT YOU GROW</div>
                  <h1>Little wins. Lasting wonders.</h1>
                  <p>
                    Your stars and achievements are yours to keep. Spending
                    coins never changes them.
                  </p>
                </div>
              </section>
              <div className="achievement-grid">
                {regions.map((r) => (
                  <section className="panel achievement-card" key={r.skill}>
                    <span
                      className={`achievement-medal ${state.progress[r.skill].stars ? "unlocked" : ""}`}
                    >
                      <SkillMedal
                        symbol={r.icon}
                        unlocked={state.progress[r.skill].stars > 0}
                      />
                    </span>
                    <h2>{skillNames[r.skill]}</h2>
                    <div className="big-stars">
                      {[0, 1, 2].map((i) => (
                        <Star
                          key={i}
                          fill={
                            state.progress[r.skill].stars > i
                              ? "#e9b550"
                              : "none"
                          }
                          color="#d3af65"
                        />
                      ))}
                    </div>
                    <p>
                      {state.progress[r.skill].independent} independent
                      discoveries
                    </p>
                    <div className="progress-track">
                      <span
                        style={{
                          width: `${Math.min(100, (state.progress[r.skill].independent / 9) * 100)}%`,
                        }}
                      />
                    </div>
                    <small>
                      One star for every 3 independent answers, up to 3.
                    </small>
                    <span className="mastery-label">
                      {state.progress[r.skill].mastered
                        ? "🏅 Mastery earned!"
                        : `Mastery trail: ${state.progress[r.skill].advanced}/8 advanced answers across 2 adventures`}
                    </span>
                    <button
                      className="text-link"
                      onClick={() => start(r.skill)}
                      disabled={
                        !state.settings.curriculum.enabledSkills.includes(
                          r.skill,
                        )
                      }
                    >
                      {state.settings.curriculum.enabledSkills.includes(r.skill)
                        ? "Explore this trail"
                        : "Paused in learning plan"}{" "}
                      <ArrowRight size={15} />
                    </button>
                  </section>
                ))}
              </div>
              <section className="panel badge-row">
                <span
                  className={`badge-icon ${state.sessions.length ? "earned" : ""}`}
                >
                  <Flag />
                </span>
                <div>
                  <h3>First explorer</h3>
                  <p>
                    {state.sessions.length
                      ? "Earned! You finished your first adventure."
                      : "Finish a ten-question adventure to earn this badge."}
                  </p>
                </div>
              </section>
              <section className="panel badge-row">
                <span
                  className={`badge-icon ${state.attempts.some((a) => a.wrongAnswers > 0) ? "earned" : ""}`}
                >
                  <Flame />
                </span>
                <div>
                  <h3>Kept on going</h3>
                  <p>
                    {state.attempts.some((a) => a.wrongAnswers > 0)
                      ? "Earned! You worked through a tricky question."
                      : "Try again after a tricky question to earn this badge."}
                  </p>
                </div>
              </section>
            </>
          )}
          {page === "studio" && (
            <PipStudio
              look={state.appearance}
              onChange={(look) => safely(() => changeAppearance(state, look))}
              onExplore={() => navigate("map")}
            />
          )}
          {page === "parent" && (
            <Parent
              state={state}
              update={update}
              safely={safely}
              onLeave={() => navigate("map")}
              adjust={adjustCoins}
              resolve={resolveRequest}
            />
          )}
          <footer className="page-footer">
            <span>Made for curious minds & little moments of discovery.</span>
            <span>
              <Heart size={12} /> A happy place to learn
            </span>
          </footer>
        </main>
      </div>
      {toast && (
        <div className="toast" role="status">
          <span>{toast}</span>
          <button
            className="icon-button"
            aria-label="Dismiss message"
            onClick={() => setToast("")}
          >
            <X size={18} />
          </button>
        </div>
      )}
      {parentGate && (
        <div className="modal-backdrop">
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="parent-title"
          >
            <button
              className="modal-close icon-button"
              aria-label="Close dialog"
              onClick={() => setParentGate(false)}
            >
              <X />
            </button>
            <span className="modal-icon">
              <LockKeyhole />
            </span>
            <div className="eyebrow">LOCAL DEMO ONLY</div>
            <h2 id="parent-title">The grown-up corner</h2>
            <p>
              This preview lets you try parent tools with fictional, local data.
              It has no secure login or approval protection, and a student can
              open it.
            </p>
            <p>
              Real parent access requires Firebase Authentication and verified
              backend permissions. Those services are not connected.
            </p>
            <button
              autoFocus
              className="primary"
              onClick={() => {
                setParentGate(false);
                navigate("parent");
              }}
            >
              Open demo parent preview <ArrowRight size={17} />
            </button>
            <button className="text-link" onClick={() => setParentGate(false)}>
              Back to the adventure
            </button>
          </section>
        </div>
      )}
      {confirmReward && (
        <div className="modal-backdrop">
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reward-title"
          >
            <div className="modal-reward-art">
              <RewardArtwork symbol={confirmReward.emoji} />
            </div>
            <h2 id="reward-title">A lovely choice!</h2>
            <p>
              Request <strong>{confirmReward.title}</strong> for{" "}
              {confirmReward.cost} coins? Your coins will be reserved while your
              demo grown-up decides.
            </p>
            <div className="button-row">
              <button
                autoFocus
                className="primary"
                onClick={() => {
                  safely(() =>
                    requestReward(state, confirmReward.id, uid(), now()),
                  );
                  setConfirmReward(null);
                }}
              >
                Request treasure <Check size={16} />
              </button>
              <button
                className="secondary"
                onClick={() => setConfirmReward(null)}
              >
                Keep saving
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
function Manipulative({
  question: q,
}: {
  question: ReturnType<typeof generateQuestion>;
}) {
  if (q.skill === "multiplication" || q.skill === "division") {
    const rows = q.skill === "multiplication" ? q.a : q.b;
    const cols = q.skill === "multiplication" ? q.b : q.answer;
    return (
      <div
        className="array-visual"
        aria-label={`${rows} groups of ${cols} dots`}
      >
        {Array.from({ length: rows }, (_, i) => (
          <div className="dot-group" key={i}>
            {Array.from({ length: cols }, (_, j) => (
              <span key={j} />
            ))}
          </div>
        ))}
      </div>
    );
  }
  const step = q.skill === "addition" ? 1 : -1;
  const b = Math.min(q.b, 10);
  const start = q.a;
  return (
    <div className="number-line">
      <span className="number-line-label">
        {q.b > 10
          ? "First, try a few single steps:"
          : "Hop along the number line:"}
      </span>
      <div className="number-line-points">
        {Array.from({ length: b + 1 }, (_, i) => (
          <span key={i}>
            <i />
            {start + i * step}
          </span>
        ))}
      </div>
      <span>
        {q.skill === "addition" ? "→ Count forward" : "← Count backward"}
      </span>
    </div>
  );
}
