import {
  beforeAll,
  afterAll,
  beforeEach,
  describe,
  it,
  expect,
  vi,
} from "vitest";
import { readFileSync } from "node:fs";
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  writeBatch,
  Timestamp,
  serverTimestamp,
} from "firebase/firestore";
import { CloudRepository } from "../src/lib/cloudRepository";
import * as cloudModel from "../src/lib/cloudModel";

let env: RulesTestEnvironment;
const parentClaims = () => ({
  email_verified: true,
  email: "test@example.test",
  firebase: { sign_in_provider: "password" },
  auth_time: Math.floor(Date.now() / 1000),
});
const childClaims = { firebase: { sign_in_provider: "anonymous" } };
const root = "familiesV2/parent-a/children/explorer";
const parentDb = () =>
  env.authenticatedContext("parent-a", parentClaims()).firestore();
const childDb = () =>
  env.authenticatedContext("child-a", childClaims).firestore();
async function family() {
  const p = new CloudRepository(parentDb(), "parent-a");
  await p.initialize("Explorer", true);
  await p.reload();
  await assertSucceeds(getDoc(doc(p.db, "sparkDevices/child-a")));
  await setDoc(doc(p.db, "sparkDevices/child-a"), {
    parentUid: "parent-a",
    childId: "explorer",
    revoked: false,
    createdAt: serverTimestamp(),
    expiresAt: Timestamp.fromMillis(Date.now() + 86400000),
  });
  const child = new CloudRepository(childDb(), "parent-a");
  await child.reload();
  return { p, child };
}
beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-math-quest-spark",
    firestore: {
      host: "127.0.0.1",
      port: 8080,
      rules: readFileSync("firestore.spark.rules", "utf8"),
    },
  });
});
beforeEach(async () => {
  await env.clearFirestore();
});
afterAll(async () => {
  await env?.cleanup();
});
describe("Spark-only authorization and atomic economy", () => {
  it("persists the new creature voices without changing the wallet or accepting arbitrary styles", async () => {
    const { child } = await family();
    const balance = child.wallet.balance;
    for (const voice of ["mellow", "robot", "chime"] as const) {
      await child.preferences({
        ...child.state,
        appearance: { ...child.state.appearance, voice },
      });
      expect(child.state.appearance.voice).toBe(voice);
      expect(child.wallet.balance).toBe(balance);
    }
    await assertFails(
      updateDoc(doc(child.db, root), { "appearance.voice": "unknown" }),
    );
  });
  it("keeps normal practice available when pack collections are not deployed yet", async () => {
    const current = readFileSync("firestore.spark.rules", "utf8");
    const rollout = current
      .replace(
        /match \/packCatalog\/\{id\} \{\s*allow read: if member\(owner,child\);/,
        "match /packCatalog/{id} { allow read: if false;",
      )
      .replace(
        /match \/cosmetics\/\{id\} \{\s*allow read: if member\(owner,child\);/,
        "match /cosmetics/{id} { allow read: if false;",
      );
    expect(rollout).not.toBe(current);
    const staged = await initializeTestEnvironment({
      projectId: "demo-math-quest-pack-rollout",
      firestore: { host: "127.0.0.1", port: 8080, rules: rollout },
    });
    try {
      const db = staged
        .authenticatedContext("parent-a", parentClaims())
        .firestore();
      const p = new CloudRepository(db, "parent-a");
      await p.initialize("Explorer", false);
      await p.reload();
      expect(p.state.packSupport).toBe(false);
      expect(p.state.ownedPacks).toEqual([]);
      await p.start("multiplication");
      await p.answer(String(p.active!.question.answer));
      expect(p.wallet.balance).toBe(3);
    } finally {
      await staged.cleanup();
    }
  });
  it("buys a costume pack atomically, persists ownership, and never charges twice", async () => {
    const { p, child } = await family();
    await p.savePackSetting("halloween", { price: 20, enabled: true });
    await p.adjust(30, "Costume test award");
    await child.buyPack("halloween", 20);
    expect(child.wallet.balance).toBe(10);
    expect(child.state.ownedPacks).toEqual(["halloween"]);
    expect(child.state.requests).toEqual([]);
    await child.buyPack("halloween", 20);
    expect(child.wallet.balance).toBe(10);
    await child.preferences({
      ...child.state,
      appearance: { ...child.state.appearance, outfit: "witch" },
    });
    await p.savePackSetting("halloween", { price: 100, enabled: false });
    await child.preferences({
      ...child.state,
      appearance: { ...child.state.appearance, outfit: "ghost" },
    });
    const fresh = new CloudRepository(child.db, "parent-a");
    await fresh.reload();
    expect(fresh.state.ownedPacks).toEqual(["halloween"]);
    expect(fresh.state.appearance.outfit).toBe("ghost");
    expect(fresh.wallet.balance).toBe(10);
    await assertFails(
      updateDoc(child.ref("cosmetics", "halloween"), { price: 0 }),
    );
  });
  it("rejects child catalog edits, unowned outfits, forged ownership and coordinated underpayment", async () => {
    const { p, child } = await family();
    await p.savePackSetting("halloween", { price: 20, enabled: true });
    await p.adjust(30, "Costume test award");
    await expect(
      child.savePackSetting("halloween", { price: 0, enabled: true }),
    ).rejects.toThrow();
    await expect(
      child.preferences({
        ...child.state,
        appearance: { ...child.state.appearance, outfit: "witch" },
      }),
    ).rejects.toThrow();
    await assertFails(
      setDoc(child.ref("cosmetics", "halloween"), {
        packId: "halloween",
        price: 20,
        at: serverTimestamp(),
      }),
    );
    const batch = writeBatch(child.db);
    batch.set(child.ref("cosmetics", "halloween"), {
      packId: "halloween",
      price: 1,
      at: serverTimestamp(),
    });
    batch.set(child.ref("ledger", "pack-halloween"), {
      kind: "pack",
      amount: -1,
      reason: "Costume pack: Halloween stories",
      ref: "halloween",
      at: serverTimestamp(),
    });
    batch.update(child.ref("wallet", "current"), {
      balance: 29,
      lastOp: "pack-halloween",
      updatedAt: serverTimestamp(),
    });
    await assertFails(batch.commit());
    await child.reload();
    expect(child.wallet.balance).toBe(30);
    expect(child.state.ownedPacks).toEqual([]);
  });
  it("prevents overspending across simultaneous pack purchases", async () => {
    const { p, child } = await family();
    await p.savePackSetting("halloween", { price: 20, enabled: true });
    await p.savePackSetting("ocean", { price: 20, enabled: true });
    await p.adjust(30, "Costume test award");
    const other = new CloudRepository(child.db, "parent-a");
    await other.reload();
    const results = await Promise.allSettled([
      child.buyPack("halloween", 20),
      other.buyPack("ocean", 20),
    ]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    await child.reload();
    expect(child.wallet.balance).toBe(10);
    expect(child.state.ownedPacks).toHaveLength(1);
  });
  it("checks disabled packs, current prices, funds and explicit free packs", async () => {
    const { p, child } = await family();
    await p.savePackSetting("halloween", { price: 20, enabled: false });
    await expect(child.buyPack("halloween", 20)).rejects.toThrow(/not opened/);
    await p.savePackSetting("halloween", { price: 20, enabled: true });
    await expect(child.buyPack("halloween", 20)).rejects.toThrow(/more coins/);
    await p.adjust(30, "Costume test award");
    await p.savePackSetting("halloween", { price: 25, enabled: true });
    await expect(child.buyPack("halloween", 20)).rejects.toThrow(
      /price changed/,
    );
    await p.savePackSetting("cozy", { price: 0, enabled: true });
    await child.buyPack("cozy", 0);
    expect(child.wallet.balance).toBe(30);
    expect(child.state.ownedPacks).toEqual(["cozy"]);
    const outsider = env
      .authenticatedContext("unbound", childClaims)
      .firestore();
    await assertFails(getDoc(doc(outsider, `${root}/cosmetics/cozy`)));
    await assertFails(getDoc(doc(outsider, `${root}/packCatalog/cozy`)));
  });
  it("rejects a coordinated forged award even when every client transaction document agrees", async () => {
    const { child } = await family();
    await child.start("multiplication");
    const forged = vi.spyOn(cloudModel, "cloudAward").mockReturnValue(999);
    try {
      await expect(
        child.answer(String(child.active!.question.answer)),
      ).rejects.toThrow();
    } finally {
      forged.mockRestore();
    }
    await child.reload();
    expect(child.wallet.balance).toBe(0);
    expect(child.state.attempts).toHaveLength(0);
    expect(child.active!.answered).toBe(false);
    await child.answer(String(child.active!.question.answer));
    expect(child.wallet.balance).toBe(3);
  });
  it("accepts all enabled math trails while preserving the shared daily cap", async () => {
    const { p, child } = await family();
    await p.saveSettings({
      ...p.state,
      settings: {
        ...p.state.settings,
        curriculum: {
          ...p.state.settings.curriculum,
          revision: 2,
          enabledSkills: [
            "addition",
            "subtraction",
            "multiplication",
            "division",
          ],
        },
      },
    });
    await child.reload();
    for (const skill of [
      "addition",
      "subtraction",
      "multiplication",
      "division",
    ] as const) {
      await child.start(skill);
      for (let i = 0; i < 10; i++) {
        await child.answer(String(child.active!.question.answer));
        await child.next();
      }
    }
    expect(child.wallet.balance).toBe(40);
    expect(child.wallet.total).toBe(40);
    for (const skill of [
      "addition",
      "subtraction",
      "multiplication",
      "division",
    ] as const)
      expect(child.state.progress[skill].stars).toBe(3);
  }, 30000);
  it("requires a verified password parent; rejects anonymous and forged role bootstrap", async () => {
    for (const claims of [
      {},
      { parent: true },
      childClaims,
      { ...parentClaims(), email_verified: false },
    ]) {
      const r = new CloudRepository(
        env.authenticatedContext("parent-a", claims).firestore(),
        "parent-a",
      );
      await expect(r.initialize("Explorer", false)).rejects.toThrow();
    }
    const { p } = await family();
    expect(p.wallet.balance).toBe(0);
    expect(p.state.rewards).toHaveLength(3);
  });
  it("isolates families and siblings, and rejects self-enrollment and role promotion", async () => {
    const { child } = await family();
    await assertSucceeds(getDoc(doc(child.db, root)));
    await assertFails(
      getDoc(doc(child.db, "familiesV2/parent-b/children/explorer")),
    );
    await assertFails(
      getDoc(doc(child.db, "familiesV2/parent-a/children/sibling")),
    );
    await assertFails(
      setDoc(doc(child.db, "sparkDevices/forged"), {
        parentUid: "parent-a",
        childId: "explorer",
        revoked: false,
        expiresAt: Timestamp.fromMillis(Date.now() + 86400000),
        createdAt: serverTimestamp(),
      }),
    );
    await assertFails(updateDoc(doc(child.db, root), { role: "parent" }));
  });
  it("supports start, hint, wrong answer, correct answer, durable progress and resume", async () => {
    const { child } = await family();
    const s = await child.start("multiplication");
    expect(s.index).toBe(0);
    await child.hint();
    expect(child.active!.hints).toBe(1);
    await child.answer(String(s.question.answer + 1));
    expect(child.active!.wrongs).toBe(1);
    const result = await child.answer(String(s.question.answer));
    expect(result).toEqual({ correct: true, earned: 1 });
    expect(child.wallet.balance).toBe(1);
    expect(child.state.attempts[0].independent).toBe(false);
    expect(child.facts.size).toBe(1);
    await child.next();
    expect(child.active!.index).toBe(1);
    const resumed = new CloudRepository(child.db, "parent-a");
    await resumed.reload();
    expect(resumed.active!.question.id).toBe(child.active!.question.id);
  });
  it("rejects forged balances, progress, fabricated attempts and duplicate credits", async () => {
    const { child } = await family();
    await child.start("multiplication");
    await assertFails(
      updateDoc(child.ref("wallet", "current"), {
        balance: 999999,
        updatedAt: serverTimestamp(),
      }),
    );
    await assertFails(
      updateDoc(child.ref("progress", "multiplication"), {
        stars: 3,
        mastered: true,
      }),
    );
    await assertFails(
      setDoc(child.ref("attempts", "fabricated"), { coins: 100 }),
    );
    const q = child.active!.question;
    await child.answer(String(q.answer));
    expect(child.wallet.balance).toBe(3);
    await expect(child.answer(String(q.answer))).rejects.toThrow();
    await child.reload();
    expect(child.wallet.balance).toBe(3);
  });
  it("enforces anti-farming caps, immutable questions, and completes ten distinct families", async () => {
    const { child } = await family();
    await child.start("multiplication");
    const facts = new Set<string>();
    for (let i = 0; i < 10; i++) {
      const s = child.active!;
      facts.add(s.asked[s.index]);
      await assertFails(
        updateDoc(child.ref("sessions", s.id), {
          "question.answer": 999,
          updatedAt: serverTimestamp(),
        }),
      );
      await child.answer(String(s.question.answer));
      await child.next();
    }
    expect(facts.size).toBe(10);
    expect(child.active!.finished).toBe(true);
    expect(child.wallet.total).toBe(10);
    expect(child.state.progress.multiplication.stars).toBe(3);
    expect(child.state.progress.multiplication.mastered).toBe(false);
  });
  it("reserves, approves, refunds exactly once and preserves inventory capacity", async () => {
    const { p, child } = await family();
    await p.adjust(70, "Parent test award");
    await child.requestReward("picnic", "request-a");
    await child.requestReward("picnic", "request-a");
    expect(child.wallet.balance).toBe(10);
    await expect(child.requestReward("picnic", "request-b")).rejects.toThrow();
    await expect(child.resolve("request-a", "approved")).rejects.toThrow();
    await p.resolve("request-a", "approved");
    await p.resolve("request-a", "declined");
    await p.resolve("request-a", "declined");
    expect(p.wallet.balance).toBe(70);
    await child.reload();
    expect(child.state.requests[0].status).toBe("declined");
    await child.requestReward("picnic", "request-c");
    expect(child.wallet.balance).toBe(10);
  });
  it("rejects negative balance, child awards, missing ledger coupling and double refunds", async () => {
    const { p, child } = await family();
    await expect(p.adjust(-1, "No overdrafts")).rejects.toThrow();
    await expect(child.adjust(100, "Forged award")).rejects.toThrow();
    await p.adjust(30, "Family award");
    await child.requestReward("movie", "movie-request");
    await assertFails(
      updateDoc(child.ref("requests", "movie-request"), {
        status: "declined",
        updatedAt: serverTimestamp(),
      }),
    );
    await p.resolve("movie-request", "approved");
    await p.resolve("movie-request", "fulfilled");
    await expect(p.resolve("movie-request", "declined")).rejects.toThrow();
    const batch = writeBatch(p.db);
    batch.update(p.ref("wallet", "current"), {
      balance: 50,
      lastOp: "missing",
      updatedAt: serverTimestamp(),
    });
    await assertFails(batch.commit());
  });
  it("serializes simultaneous spending without overdraft", async () => {
    const { p, child } = await family();
    await p.adjust(40, "Concurrency setup");
    const results = await Promise.allSettled([
      child.requestReward("movie", "race-a"),
      child.requestReward("movie", "race-b"),
    ]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    await child.reload();
    expect(child.wallet.balance).toBe(10);
  });
  it("enforces daily limits on the server and preserves session curriculum snapshots", async () => {
    const { p, child } = await family();
    await p.saveSettings({
      ...p.state,
      settings: { ...p.state.settings, dailyCap: 2 },
    });
    await child.reload();
    await child.start("multiplication");
    const old = child.active!.plan;
    await p.reload();
    await p.saveSettings({
      ...p.state,
      settings: {
        ...p.state.settings,
        curriculum: {
          ...p.state.settings.curriculum,
          maxFactor: 5,
          revision: 2,
        },
      },
    });
    await child.answer(String(child.active!.question.answer));
    expect(child.wallet.balance).toBe(2);
    await child.next();
    await child.answer(String(child.active!.question.answer));
    expect(child.wallet.balance).toBe(2);
    expect(child.active!.plan).toEqual(old);
    await assertFails(
      updateDoc(doc(child.db, root), { "settings.dailyCap": 200 }),
    );
  });
  it("revokes and expires child devices without trusting local flags", async () => {
    const { p, child } = await family();
    await updateDoc(doc(p.db, "sparkDevices/child-a"), { revoked: true });
    await assertFails(getDoc(doc(child.db, root)));
    await updateDoc(doc(p.db, "sparkDevices/child-a"), {
      revoked: false,
      expiresAt: Timestamp.fromMillis(Date.now() - 1000),
    });
    await assertFails(getDoc(doc(child.db, root)));
    await assertFails(
      getDoc(doc(env.unauthenticatedContext().firestore(), root)),
    );
  });
  it("rejects stale parent sessions, draft rewards, forged refunds and forged difficulty", async () => {
    const { p, child } = await family();
    const stale = env
      .authenticatedContext("parent-a", {
        ...parentClaims(),
        auth_time: Math.floor(Date.now() / 1000) - 7200,
      })
      .firestore();
    await assertFails(getDoc(doc(stale, root)));
    await p.saveReward({
      ...p.state.rewards.find((r) => r.id === "movie")!,
      approved: false,
    });
    await p.adjust(100, "Parent award");
    await expect(
      child.requestReward("movie", "draft-request"),
    ).rejects.toThrow();
    await child.start("multiplication");
    const s = child.active!;
    await assertFails(
      updateDoc(child.ref("sessions", s.id), {
        "question.level": 3,
        updatedAt: serverTimestamp(),
      }),
    );
    await assertFails(
      updateDoc(child.ref("wallet", "current"), {
        balance: 150,
        lastOp: "refund-forged",
        updatedAt: serverTimestamp(),
      }),
    );
  });
  it("enforces the five-credit bucket across adventures and earns durable mastery across sessions", async () => {
    const { child } = await family();
    for (let run = 0; run < 2; run++) {
      await child.start("multiplication");
      for (let i = 0; i < 10; i++) {
        await child.answer(String(child.active!.question.answer));
        await child.next();
      }
    }
    expect(child.wallet.counts["multiplication-3"]).toBe(5);
    expect(child.wallet.balance).toBe(33);
    expect(child.state.progress.multiplication.mastered).toBe(true);
    const fresh = new CloudRepository(child.db, "parent-a");
    await fresh.reload();
    expect(fresh.state.progress.multiplication.mastered).toBe(true);
    expect(fresh.facts.size).toBeGreaterThan(10);
  });
});
