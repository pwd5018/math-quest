import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  startAfter,
  Timestamp,
  where,
  writeBatch,
  type DocumentSnapshot,
  type Firestore,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import {
  blankCloudState,
  CHILD_ID,
  cloudAward,
  cloudProgress,
  emptyBuckets,
  emptyWallet,
  HISTORY_PAGE,
  questionKey,
  utcDay,
  type CloudSession,
  type Wallet,
} from "./cloudModel";
import { initialState } from "./storage";
import { initialProgress } from "./learning";
import type { Attempt } from "./learning";
import type { LedgerEntry, Request, Reward, State } from "./economy";
import { selectQuestion, type FactEvidence } from "./curriculum";
import { checkAnswer, type Skill } from "./math";

type CloudFact = FactEvidence & { lastAttempt: string };
const clean = <T>(value: T): T => JSON.parse(JSON.stringify(value));
const iso = (value: unknown): string =>
  value instanceof Timestamp
    ? value.toDate().toISOString()
    : typeof value === "string"
      ? value
      : "";
export class CloudRepository {
  readonly root: string;
  state: State = blankCloudState();
  wallet: Wallet = emptyWallet();
  active: CloudSession | null = null;
  facts = new Map<string, CloudFact>();
  private cursors = new Map<string, QueryDocumentSnapshot>();
  private loaded = new Map<string, Record<string, unknown>[]>();
  private stop: () => void = () => {};
  private refreshing = false;
  private refreshAgain = false;
  private paused = false;
  pause(value: boolean) {
    this.paused = value;
  }
  constructor(
    readonly db: Firestore,
    readonly owner: string,
    readonly child = CHILD_ID,
  ) {
    this.root = `familiesV2/${owner}/children/${child}`;
  }
  ref(kind: string, id: string) {
    return doc(this.db, `${this.root}/${kind}/${id}`);
  }
  async initialize(nickname: string, samples: boolean) {
    const profile = doc(this.db, this.root);
    if ((await getDoc(profile)).exists()) return;
    const s = blankCloudState(),
      batch = writeBatch(this.db);
    batch.set(profile, {
      nickname: nickname.trim(),
      appearance: s.appearance,
      goalId: null,
      settings: s.settings,
      createdAt: serverTimestamp(),
    });
    batch.set(this.ref("wallet", "current"), {
      ...emptyWallet(),
      updatedAt: serverTimestamp(),
    });
    batch.set(this.ref("runtime", "current"), {
      sessionId: "",
      updatedAt: serverTimestamp(),
    });
    for (const [skill, progress] of Object.entries(initialProgress()))
      batch.set(this.ref("progress", skill), { ...progress, lastAttempt: "" });
    if (samples)
      for (const reward of initialState().rewards)
        batch.set(this.ref("rewards", reward.id), { ...reward, used: 0 });
    await batch.commit();
  }
  async exists() {
    return (await getDoc(doc(this.db, this.root))).exists();
  }
  subscribe(onChange: () => void, onError: (e: Error) => void) {
    let closed = false;
    const refresh = async () => {
      if (this.paused || closed) return;
      if (this.refreshing) {
        this.refreshAgain = true;
        return;
      }
      this.refreshing = true;
      try {
        do {
          this.refreshAgain = false;
          await this.refresh();
          if (!closed) onChange();
        } while (this.refreshAgain && !closed);
      } catch (e) {
        if (!closed) onError(e as Error);
      } finally {
        this.refreshing = false;
      }
    };
    // Wallet changes cover practice/economy; profile covers settings and preferences.
    const unsubs = [
      onSnapshot(doc(this.db, this.root), () => void refresh(), onError),
      onSnapshot(this.ref("wallet", "current"), () => void refresh(), onError),
      onSnapshot(this.ref("runtime", "current"), () => void refresh(), onError),
    ];
    // Request approvals need no wallet change. Bound each live collection query.
    for (const kind of ["requests", "rewards", "sessions"])
      unsubs.push(
        onSnapshot(
          query(
            collection(this.db, `${this.root}/${kind}`),
            ...(kind === "sessions" ? [where("finished", "==", true)] : []),
            limit(100),
          ),
          () => void refresh(),
          onError,
        ),
      );
    this.stop = () => {
      closed = true;
      unsubs.forEach((u) => u());
    };
    return this.stop;
  }
  close() {
    this.stop();
  }
  private async history(kind: string, more = false) {
    const cursor = more ? this.cursors.get(kind) : undefined;
    const q = query(
      collection(this.db, `${this.root}/${kind}`),
      orderBy(kind === "sessions" ? "updatedAt" : "at", "desc"),
      ...(cursor ? [startAfter(cursor)] : []),
      limit(HISTORY_PAGE),
    );
    const result = await getDocs(q);
    if (result.docs.length && (more || !this.cursors.has(kind)))
      this.cursors.set(kind, result.docs[result.docs.length - 1]);
    const previous = this.loaded.get(kind) ?? [];
    const merged = new Map(previous.map((d) => [d._id, d]));
    result.docs.forEach((d) => merged.set(d.id, { ...d.data(), _id: d.id }));
    this.loaded.set(kind, [...merged.values()]);
  }
  async loadMore() {
    await Promise.all(
      ["attempts", "events", "ledger", "sessions", "requests"].map((k) =>
        this.history(k, true),
      ),
    );
    await this.hydrate();
  }
  private async refresh() {
    // Retain older explicitly loaded pages while replacing the newest page.
    await Promise.all(
      ["attempts", "events", "ledger", "sessions", "requests"].map((k) =>
        this.history(k),
      ),
    );
    await this.hydrate();
  }
  async reload() {
    await Promise.all(
      ["attempts", "events", "ledger", "sessions", "requests"].map((k) =>
        this.history(k),
      ),
    );
    await this.hydrate();
  }
  private async hydrate() {
    const [p, w, progress, rewards, facts, runtime] = await Promise.all([
      getDoc(doc(this.db, this.root)),
      getDoc(this.ref("wallet", "current")),
      getDocs(collection(this.db, `${this.root}/progress`)),
      getDocs(collection(this.db, `${this.root}/rewards`)),
      getDocs(
        query(
          collection(this.db, `${this.root}/facts`),
          orderBy("last", "desc"),
          limit(1000),
        ),
      ),
      getDoc(this.ref("runtime", "current")),
    ]);
    if (!p.exists() || !w.exists())
      throw new Error(
        "This family profile is not ready. Ask your parent to finish setup.",
      );
    this.wallet = w.data() as Wallet;
    const sid = runtime.data()?.sessionId;
    this.active = sid
      ? ((await getDoc(this.ref("sessions", sid))).data() as CloudSession)
      : null;
    this.facts = new Map(facts.docs.map((d) => [d.id, d.data() as CloudFact]));
    const attempts = (this.loaded.get("attempts") ?? []).map((d) => ({
      ...d,
      at: iso(d.at),
    })) as unknown as Attempt[];
    const ledger = (this.loaded.get("ledger") ?? []).map((d) => ({
      id: d._id,
      amount: d.amount,
      reason: d.reason,
      at: iso(d.at),
      reference: d.ref,
    })) as LedgerEntry[];
    // A read-only opening-balance display reconciles paginated ledger pages.
    const opening =
      this.wallet.balance - ledger.reduce((n, e) => n + e.amount, 0);
    if (opening !== 0)
      ledger.unshift({
        id: "opening-display",
        amount: opening,
        reason: "Balance before loaded ledger history",
        at: "",
      });
    const sessions = (this.loaded.get("sessions") ?? [])
      .filter((d) => d.finished)
      .map((d) => ({
        id: d.id,
        skill: d.skill,
        at: iso(d.updatedAt),
        independent: d.independent,
        coins: d.coins,
        plan: d.plan,
        seed: d.seed,
      })) as State["sessions"];
    // The shared UI slices the newest entries from chronologically ordered arrays.
    attempts.sort((a, b) => a.at.localeCompare(b.at));
    ledger.sort((a, b) => a.at.localeCompare(b.at));
    sessions.sort((a, b) => a.at.localeCompare(b.at));
    this.state = {
      ...blankCloudState(),
      ...p.data(),
      version: 1,
      attempts,
      events: (this.loaded.get("events") ?? [])
        .sort((a, b) => iso(a.at).localeCompare(iso(b.at)))
        .map((d) => ({ ...d, at: iso(d.at) })) as unknown as State["events"],
      progress: Object.fromEntries(
        progress.docs.map((d) => [d.id, d.data()]),
      ) as State["progress"],
      rewards: rewards.docs.map((d) => d.data() as Reward),
      requests: (this.loaded.get("requests") ?? [])
        .sort((a, b) => iso(a.at).localeCompare(iso(b.at)))
        .map((d) => ({
          ...d,
          at: iso(d.at),
        })) as Request[],
      ledger,
      sessions,
    };
  }
  private choose(
    skill: Skill,
    level: number,
    seed: number,
    index: number,
    id: string,
    plan: CloudSession["plan"],
    asked: string[],
  ) {
    const history = {
      total: this.wallet.total,
      facts: new Map(
        [...this.facts].map(([key, v]) => [key.replaceAll("-", ":"), v]),
      ),
    };
    // The scheduler excludes canonical facts via its normal question interface.
    const excluded = asked.map((key) => {
      const [skill, a, b] = key.split("-");
      return { skill, a: Number(a), b: Number(b) };
    }) as CloudSession["question"][];
    return selectQuestion({
      skill,
      level,
      seed,
      index,
      sessionId: id,
      plan,
      asked: excluded,
      events: this.state.events,
      history,
    });
  }
  async start(skill: Skill) {
    const id: string = crypto.randomUUID(),
      seed = (crypto.getRandomValues(new Uint32Array(1))[0] % 999999999) + 1;
    await runTransaction(this.db, async (tx) => {
      const pointer = await tx.get(this.ref("runtime", "current"));
      const oldId = pointer.data()?.sessionId;
      const old = oldId ? await tx.get(this.ref("sessions", oldId)) : null;
      if (
        old?.exists() &&
        !old.data().finished &&
        iso(old.data().createdAt) >
          new Date(Date.now() - 86400000).toISOString()
      )
        return;
      const p = await tx.get(doc(this.db, this.root));
      const progress = await tx.get(this.ref("progress", skill));
      const plan = p.data()!.settings.curriculum;
      const question = this.choose(
        skill,
        progress.data()!.level,
        seed,
        0,
        id,
        plan,
        [],
      );
      const s: CloudSession = {
        id,
        skill,
        seed,
        index: 0,
        question,
        plan,
        asked: [questionKey(question)],
        hints: 0,
        wrongs: 0,
        first: "",
        answered: false,
        finished: false,
        independent: 0,
        coins: 0,
        action: "start",
        eventId: "",
      };
      tx.set(this.ref("sessions", id), {
        ...clean(s),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      tx.update(this.ref("runtime", "current"), {
        sessionId: id,
        updatedAt: serverTimestamp(),
      });
    });
    await this.reload();
    return this.active!;
  }
  async answer(input: string) {
    if (!/^\d{1,9}$/.test(input.trim()))
      throw new Error("Enter a whole number.");
    const expected = this.active;
    if (!expected) throw new Error("Start an adventure first.");
    const numeric = Number(input),
      answer = String(numeric),
      eventId = crypto.randomUUID();
    let earned = 0,
      correct = false;
    await runTransaction(this.db, async (tx) => {
      const sessionRef = this.ref("sessions", expected.id),
        snapshot = await tx.get(sessionRef),
        s = snapshot.data() as CloudSession;
      if (s.question.id !== expected.question.id || s.answered)
        throw new Error("This answer is already saved. Refresh to resume.");
      const q = s.question;
      correct = checkAnswer(q, answer);
      const event = {
        questionId: q.id,
        sessionId: s.id,
        question: { a: q.a, b: q.b, skill: q.skill, symbol: q.symbol },
        kind: "answer",
        answer,
        numericAnswer: numeric,
        correct,
        at: serverTimestamp(),
      };
      if (!correct) {
        tx.set(this.ref("events", eventId), event);
        tx.update(sessionRef, {
          action: "wrong",
          eventId,
          wrongs: s.wrongs + 1,
          first: s.first || answer,
          updatedAt: serverTimestamp(),
        });
        return;
      }
      const [walletSnap, p, progressSnap, factSnap] = await Promise.all([
        tx.get(this.ref("wallet", "current")),
        tx.get(doc(this.db, this.root)),
        tx.get(this.ref("progress", s.skill)),
        tx.get(this.ref("facts", questionKey(q))),
      ]);
      const wallet = walletSnap.data() as Wallet,
        day = utcDay(Date.now()),
        independent = s.hints === 0 && s.wrongs === 0;
      earned = cloudAward(
        wallet,
        s.skill,
        q.level,
        independent,
        p.data()!.settings.dailyCap,
        day,
      );
      const attempt = {
        id: q.id,
        sessionId: s.id,
        skill: s.skill,
        level: q.level,
        question: q,
        firstAnswer: s.first || answer,
        independent,
        hints: s.hints,
        wrongAnswers: s.wrongs,
        coins: earned,
        answer: numeric,
        at: serverTimestamp(),
      };
      const nextProgress = cloudProgress(
        progressSnap.data() as State["progress"][Skill],
        independent,
        q.level,
        s.id,
      );
      const old = factSnap.exists()
        ? (factSnap.data() as CloudFact)
        : { count: 0, independentStreak: 0, tricky: false };
      const streak = independent ? old.independentStreak + 1 : 0;
      const counts = wallet.day === day ? { ...wallet.counts } : emptyBuckets();
      if (earned > 0) counts[`${s.skill}-${q.level}`]++;
      tx.set(this.ref("events", eventId), event);
      tx.set(this.ref("attempts", q.id), {
        ...clean({ ...attempt, at: null }),
        at: serverTimestamp(),
      });
      tx.update(sessionRef, {
        action: "correct",
        eventId,
        answered: true,
        coins: s.coins + earned,
        independent: s.independent + Number(independent),
        updatedAt: serverTimestamp(),
      });
      tx.set(this.ref("progress", s.skill), {
        ...nextProgress,
        lastAttempt: q.id,
      });
      tx.set(this.ref("facts", questionKey(q)), {
        count: old.count + 1,
        independentStreak: streak,
        tricky: !independent || (old.tricky && streak < 2),
        last: wallet.total + 1,
        lastAttempt: q.id,
      });
      tx.set(this.ref("wallet", "current"), {
        ...wallet,
        balance: wallet.balance + earned,
        total: wallet.total + 1,
        day,
        earned: (wallet.day === day ? wallet.earned : 0) + earned,
        counts,
        lastOp: `earn-${q.id}`,
        updatedAt: serverTimestamp(),
      });
      tx.set(this.ref("ledger", `earn-${q.id}`), {
        kind: "practice",
        amount: earned,
        reason: `${s.skill} practice${independent ? "" : " · perseverance"}`,
        ref: q.id,
        at: serverTimestamp(),
      });
    });
    await this.reload();
    return { correct, earned };
  }
  async hint() {
    const s = this.active;
    if (!s) throw new Error("Start an adventure first.");
    const id: string = crypto.randomUUID();
    await runTransaction(this.db, async (tx) => {
      const snap = await tx.get(this.ref("sessions", s.id)),
        current = snap.data() as CloudSession;
      if (current.question.id !== s.question.id || current.answered)
        throw new Error("This question has already moved on.");
      const q = current.question;
      tx.set(this.ref("events", id), {
        questionId: q.id,
        sessionId: s.id,
        question: { a: q.a, b: q.b, skill: q.skill, symbol: q.symbol },
        kind: "hint",
        answer: "",
        numericAnswer: 0,
        correct: false,
        at: serverTimestamp(),
      });
      tx.update(this.ref("sessions", s.id), {
        action: "hint",
        eventId: id,
        hints: current.hints + 1,
        updatedAt: serverTimestamp(),
      });
    });
    await this.reload();
  }
  async next() {
    const expected = this.active;
    if (!expected) throw new Error("No adventure to resume.");
    await runTransaction(this.db, async (tx) => {
      const ref = this.ref("sessions", expected.id),
        snap = await tx.get(ref),
        s = snap.data() as CloudSession;
      if (!s.answered || s.finished) return;
      const p = await tx.get(this.ref("progress", s.skill));
      if (s.index === 9) {
        tx.update(ref, {
          action: "finish",
          finished: true,
          updatedAt: serverTimestamp(),
        });
        return;
      }
      const question = this.choose(
        s.skill,
        p.data()!.level,
        s.seed,
        s.index + 1,
        s.id,
        s.plan,
        s.asked,
      );
      tx.update(ref, {
        action: "next",
        eventId: "",
        index: s.index + 1,
        question: clean(question),
        asked: [...s.asked, questionKey(question)],
        hints: 0,
        wrongs: 0,
        first: "",
        answered: false,
        updatedAt: serverTimestamp(),
      });
    });
    await this.reload();
    return this.active!;
  }
  async requestReward(rewardId: string, id: string = crypto.randomUUID()) {
    await runTransaction(this.db, async (tx) => {
      const [r, w, prior] = await Promise.all([
        tx.get(this.ref("rewards", rewardId)),
        tx.get(this.ref("wallet", "current")),
        tx.get(this.ref("requests", id)),
      ]);
      if (prior.exists()) return;
      if (!r.exists()) throw new Error("This treasure is no longer available.");
      const reward = r.data();
      const wallet = w.data() as Wallet;
      if (
        !reward.approved ||
        reward.archived ||
        !reward.available ||
        (reward.limit > 0 && reward.used >= reward.limit)
      )
        throw new Error("This treasure is not available.");
      if (wallet.balance < reward.cost)
        throw new Error("Keep exploring to save enough coins.");
      tx.set(this.ref("requests", id), {
        id,
        rewardId,
        title: reward.title,
        cost: reward.cost,
        status: "pending",
        at: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      tx.update(this.ref("rewards", rewardId), { used: reward.used + 1 });
      tx.update(this.ref("wallet", "current"), {
        balance: wallet.balance - reward.cost,
        lastOp: `spend-${id}`,
        updatedAt: serverTimestamp(),
      });
      tx.set(this.ref("ledger", `spend-${id}`), {
        kind: "request",
        amount: -reward.cost,
        reason: `Requested: ${reward.title}`,
        ref: id,
        at: serverTimestamp(),
      });
    });
    await this.reload();
  }
  async resolve(id: string, status: Request["status"]) {
    await runTransaction(this.db, async (tx) => {
      const request = await tx.get(this.ref("requests", id));
      if (!request.exists()) throw new Error("Request not found.");
      const r = request.data();
      if (r.status === status) return;
      const [wallet, reward] =
        status === "declined"
          ? await Promise.all([
              tx.get(this.ref("wallet", "current")),
              tx.get(this.ref("rewards", r.rewardId)),
            ])
          : [null, null];
      tx.update(this.ref("requests", id), {
        status,
        updatedAt: serverTimestamp(),
      });
      if (status === "declined") {
        tx.update(this.ref("wallet", "current"), {
          balance: wallet!.data()!.balance + r.cost,
          lastOp: `refund-${id}`,
          updatedAt: serverTimestamp(),
        });
        tx.update(this.ref("rewards", r.rewardId), {
          used: reward!.data()!.used - 1,
        });
        tx.set(this.ref("ledger", `refund-${id}`), {
          kind: "refund",
          amount: r.cost,
          reason: `Refund: ${r.title}`,
          ref: id,
          at: serverTimestamp(),
        });
      }
    });
    await this.reload();
  }
  async adjust(
    amount: number,
    reason: string,
    id: string = crypto.randomUUID(),
  ) {
    await runTransaction(this.db, async (tx) => {
      const [w, l] = await Promise.all([
        tx.get(this.ref("wallet", "current")),
        tx.get(this.ref("ledger", id)),
      ]);
      if (l.exists()) return;
      tx.update(this.ref("wallet", "current"), {
        balance: w.data()!.balance + amount,
        lastOp: id,
        updatedAt: serverTimestamp(),
      });
      tx.set(this.ref("ledger", id), {
        kind: "adjust",
        amount,
        reason: reason.trim(),
        ref: id,
        at: serverTimestamp(),
      });
    });
    await this.reload();
  }
  async saveReward(reward: Reward) {
    await runTransaction(this.db, async (tx) => {
      const ref = this.ref("rewards", reward.id),
        old = await tx.get(ref);
      tx.set(ref, { ...clean(reward), used: old.data()?.used ?? 0 });
    });
    await this.reload();
  }
  async preferences(next: State) {
    const batch = writeBatch(this.db);
    batch.update(doc(this.db, this.root), {
      appearance: clean(next.appearance),
      goalId: next.goalId,
    });
    await batch.commit();
    await this.reload();
  }
  async saveSettings(next: State) {
    const batch = writeBatch(this.db);
    batch.update(doc(this.db, this.root), {
      nickname: next.nickname,
      settings: clean(next.settings),
    });
    await batch.commit();
    await this.reload();
  }
}
export function timestampOf(snapshot: DocumentSnapshot): string {
  return iso(snapshot.data()?.createdAt);
}
