/** Integration scaffold. Not deployed or enabled by the web app. See FIREBASE.md. */
import { randomInt, randomUUID } from "node:crypto";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import {
  checkAnswer,
  skills,
  type Skill,
  type Question,
} from "../../src/lib/math";
import { advance, type Attempt } from "../../src/lib/learning";
import {
  awardFor,
  requestReward,
  resolveRequest,
  adjustCoins,
  type State,
  type Reward,
} from "../../src/lib/economy";
import { initialState } from "../../src/lib/storage";
import { changeAppearance } from "../../src/lib/appearance";
import {
  migrateState,
  reviseCurriculum,
  selectQuestion,
  type Curriculum,
} from "../../src/lib/curriculum";
initializeApp();
const db = getFirestore();
type LiveSession = {
  id: string;
  skill: Skill;
  seed: number;
  index: number;
  question: Question;
  hints: number;
  wrongs: number;
  first: string;
  expires: number;
  coins: number;
  independent: number;
  plan: Curriculum;
  asked: Question[];
  last?: { questionId: string; response: unknown };
};
function fail(message: string): never {
  throw new HttpsError("failed-precondition", message);
}
function text(value: unknown, max = 100): string {
  if (typeof value !== "string" || !value.trim() || value.length > max)
    throw new HttpsError("invalid-argument", "Invalid text.");
  return value.trim();
}
function integer(value: unknown, min: number, max: number): number {
  if (
    typeof value !== "number" ||
    !Number.isSafeInteger(value) ||
    value < min ||
    value > max
  )
    throw new HttpsError("invalid-argument", "Invalid whole number.");
  return value;
}
function publicQuestion(q: Question) {
  return {
    id: q.id,
    skill: q.skill,
    level: q.level,
    a: q.a,
    b: q.b,
    symbol: q.symbol,
    ...(q.planRevision ? { planRevision: q.planRevision } : {}),
    ...(q.maxFactor ? { maxFactor: q.maxFactor } : {}),
    ...(q.selection ? { selection: q.selection } : {}),
    ...(q.story ? { story: q.story } : {}),
  };
}
export const questCommand = onCall(
  { region: "us-central1", enforceAppCheck: true, maxInstances: 2 },
  async (req) => {
    if (!req.auth) throw new HttpsError("unauthenticated", "Sign in first.");
    const d = req.data as Record<string, unknown>;
    if (!d || typeof d !== "object")
      throw new HttpsError("invalid-argument", "Expected a command.");
    const parent = req.auth.token.parent === true;
    if (!parent && req.auth.token.student !== true)
      throw new HttpsError(
        "permission-denied",
        "A provisioned family session is required.",
      );
    const parentId = parent ? req.auth.uid : text(req.auth.token.parentUid);
    const childId = parent
      ? text(d.childId, 64)
      : text(req.auth.token.childId, 64);
    if (!/^[\w-]+$/.test(childId) || !parentId || parentId.includes("/"))
      throw new HttpsError("invalid-argument", "Invalid family.");
    const action = text(d.action, 30),
      opId = text(d.operationId, 80);
    if (!/^[\w-]+$/.test(opId))
      throw new HttpsError("invalid-argument", "Invalid operation identifier.");
    const parentActions = [
      "initialize",
      "saveReward",
      "resolveReward",
      "adjustCoins",
      "settings",
    ];
    if (parentActions.includes(action) && !parent)
      throw new HttpsError("permission-denied", "Parent access required.");
    const ref = db.doc(`families/${parentId}/children/${childId}`),
      sessionRef = ref.collection("private").doc("session"),
      operationRef = ref.collection("operations").doc(opId);
    const at = new Date().toISOString();
    return db.runTransaction(async (tx) => {
      const [snapshot, sessionSnap, previous] = await Promise.all([
        tx.get(ref),
        tx.get(sessionRef),
        tx.get(operationRef),
      ]);
      if (previous.exists) return previous.data()!.response;
      let s = snapshot.exists
        ? migrateState(snapshot.data() as State)
        : initialState();
      let session = sessionSnap.exists
        ? (sessionSnap.data() as LiveSession)
        : null;
      let result: unknown = { ok: true };
      if (!snapshot.exists && action !== "initialize")
        fail("Parent must initialize this child profile.");
      // Bounded integration scaffold: fail closed instead of silently losing history at Firestore's document limit.
      if (
        s.attempts.length >= 500 ||
        s.events.length >= 1500 ||
        s.ledger.length >= 1000 ||
        s.requests.length >= 100
      )
        fail("Migrate history into subcollections before continuing.");
      if (action === "initialize") {
        if (snapshot.exists) fail("Already initialized.");
        s.nickname = text(d.nickname, 24);
      } else if (action === "start") {
        if (session && session.expires > Date.now() && session.index < 10)
          fail("Resume or finish the current session before starting another.");
        const skill = text(d.skill) as Skill;
        if (!skills.includes(skill))
          throw new HttpsError("invalid-argument", "Unknown skill.");
        const id = randomUUID(),
          seed = randomInt(1, 1000000000);
        const plan = structuredClone(s.settings.curriculum);
        const question = selectQuestion({
          skill,
          level: s.progress[skill].level,
          seed,
          index: 0,
          sessionId: id,
          plan,
          events: s.events,
          asked: [],
        });
        session = {
          id,
          skill,
          seed,
          index: 0,
          question,
          hints: 0,
          wrongs: 0,
          first: "",
          expires: Date.now() + 86400000,
          coins: 0,
          independent: 0,
          plan,
          asked: [question],
        };
        result = { sessionId: id, plan, question: publicQuestion(question) };
      } else if (action === "resume") {
        if (!session || session.expires < Date.now() || session.index >= 10)
          fail("No active adventure.");
        result = {
          sessionId: session.id,
          index: session.index,
          plan: session.plan,
          question: publicQuestion(session.question),
        };
      } else if (action === "hint" || action === "answer") {
        if (!session || session.expires < Date.now() || session.index >= 10)
          fail("Start an adventure first.");
        if (d.questionId !== session.question.id) {
          if (session.last?.questionId === d.questionId)
            return session.last!.response;
          fail("This question is no longer active.");
        }
        const q = session.question;
        if (action === "hint") {
          s.events.push({
            questionId: q.id,
            sessionId: session.id,
            question: { a: q.a, b: q.b, symbol: q.symbol, skill: q.skill },
            kind: "hint",
            at,
          });
          session.hints++;
          result = { hint: q.hint };
        } else {
          const answer = text(d.answer, 6);
          if (!session.first) session.first = answer;
          s.events.push({
            questionId: q.id,
            sessionId: session.id,
            question: { a: q.a, b: q.b, symbol: q.symbol, skill: q.skill },
            kind: "answer",
            answer,
            correct: checkAnswer(q, answer),
            at,
          });
          if (!checkAnswer(q, answer)) {
            session.wrongs++;
            result = {
              correct: false,
              hint: q.hint,
              ...(session.wrongs >= 2 ? { explanation: q.explanation } : {}),
            };
          } else {
            const attempt: Attempt = {
              id: q.id,
              sessionId: session.id,
              skill: q.skill,
              level: q.level,
              question: q,
              firstAnswer: session.first,
              independent: session.hints === 0 && session.wrongs === 0,
              hints: session.hints,
              wrongAnswers: session.wrongs,
              at,
              coins: 0,
            };
            attempt.coins = awardFor(s, attempt);
            s.attempts.push(attempt);
            s.progress[q.skill] = advance(s.progress[q.skill], attempt);
            if (attempt.coins)
              s.ledger.push({
                id: `earn-${q.id}`,
                amount: attempt.coins,
                reason: `${q.skill} practice`,
                reference: q.id,
                at,
              });
            session.coins += attempt.coins;
            session.independent += Number(attempt.independent);
            session.index++;
            session.hints = 0;
            session.wrongs = 0;
            session.first = "";
            if (session.index === 10)
              s.sessions.push({
                id: session.id,
                skill: q.skill,
                at,
                independent: session.independent,
                coins: session.coins,
                plan: session.plan,
                seed: session.seed,
              });
            else {
              session.question = selectQuestion({
                skill: q.skill,
                level: s.progress[q.skill].level,
                seed: session.seed,
                index: session.index,
                sessionId: session.id,
                plan: session.plan,
                events: s.events,
                asked: session.asked,
              });
              session.asked.push(session.question);
            }
            result = {
              correct: true,
              explanation: q.explanation,
              coins: attempt.coins,
              finished: session.index === 10,
              ...(session.index < 10
                ? { question: publicQuestion(session.question) }
                : {}),
            };
            session.last = { questionId: q.id, response: result };
          }
        }
      } else if (action === "requestReward")
        s = requestReward(s, text(d.rewardId), opId, at);
      else if (action === "resolveReward") {
        const next = text(d.resolution);
        if (!["approve", "decline", "fulfill"].includes(next))
          throw new HttpsError("invalid-argument", "Invalid resolution.");
        s = resolveRequest(
          s,
          text(d.requestId),
          next as "approve" | "decline" | "fulfill",
          at,
        );
      } else if (action === "adjustCoins")
        s = adjustCoins(
          s,
          integer(d.amount, -10000, 10000),
          text(d.reason, 200),
          opId,
          at,
        );
      else if (action === "settings")
        s = {
          ...s,
          nickname: text(d.nickname, 24),
          settings: {
            curriculum: reviseCurriculum(
              s.settings.curriculum,
              d.curriculum ?? s.settings.curriculum,
            ),
            dailyCap: integer(d.dailyCap, 0, 200),
            weeklySessions: integer(d.weeklySessions, 1, 14),
          },
        };
      else if (action === "appearance") s = changeAppearance(s, d.appearance);
      else if (action === "saveReward") {
        const raw = d.reward as Record<string, unknown>;
        if (!raw) throw new HttpsError("invalid-argument", "Expected reward.");
        for (const key of ["approved", "archived", "available"])
          if (typeof raw[key] !== "boolean")
            throw new HttpsError("invalid-argument", "Expected reward flags.");
        const reward: Reward = {
          id: raw.id ? text(raw.id, 80) : opId,
          title: text(raw.title, 60),
          description:
            typeof raw.description === "string"
              ? raw.description.slice(0, 180)
              : "",
          emoji: text(raw.emoji, 8),
          cost: integer(raw.cost, 1, 10000),
          limit: integer(raw.limit, 0, 100),
          approved: raw.approved as boolean,
          archived: raw.archived as boolean,
          available: raw.available as boolean,
        };
        if (
          s.rewards.length >= 30 &&
          !s.rewards.some((r) => r.id === reward.id)
        )
          fail("Archive and reuse inventory slots or migrate storage.");
        s.rewards = s.rewards.some((r) => r.id === reward.id)
          ? s.rewards.map((r) => (r.id === reward.id ? reward : r))
          : [...s.rewards, reward];
      } else throw new HttpsError("invalid-argument", "Unknown action.");
      tx.set(ref, s);
      if (session) tx.set(sessionRef, session);
      tx.set(operationRef, { at, response: result });
      return result;
    });
  },
);
