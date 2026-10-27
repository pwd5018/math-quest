import { beforeAll, afterAll, describe, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc, collection, getDocs } from "firebase/firestore";
let env: RulesTestEnvironment;
beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-math-quest",
    firestore: {
      rules: readFileSync("firestore.rules", "utf8"),
      host: "127.0.0.1",
      port: 8080,
    },
  });
  await env.withSecurityRulesDisabled(async (c) => {
    await setDoc(doc(c.firestore(), "families/parent-a/children/explorer"), {
      nickname: "Explorer",
    });
    await setDoc(
      doc(c.firestore(), "families/parent-a/children/explorer/private/session"),
      { answer: 42 },
    );
  });
});
afterAll(async () => {
  await env?.cleanup();
});
describe("Firebase access boundary", () => {
  it("denies anonymous child reads", async () => {
    await assertFails(
      getDoc(
        doc(
          env.unauthenticatedContext().firestore(),
          "families/parent-a/children/explorer",
        ),
      ),
    );
  });
  it("allows provisioned owning parent but denies unprovisioned uid", async () => {
    await assertSucceeds(
      getDoc(
        doc(
          env.authenticatedContext("parent-a", { parent: true }).firestore(),
          "families/parent-a/children/explorer",
        ),
      ),
    );
    await assertFails(
      getDoc(
        doc(
          env.authenticatedContext("parent-a").firestore(),
          "families/parent-a/children/explorer",
        ),
      ),
    );
  });
  it("denies a different parent", async () => {
    await assertFails(
      getDoc(
        doc(
          env.authenticatedContext("parent-b", { parent: true }).firestore(),
          "families/parent-a/children/explorer",
        ),
      ),
    );
  });
  it("allows only the child bound in trusted custom claims", async () => {
    const db = env
      .authenticatedContext("child-a", {
        student: true,
        parentUid: "parent-a",
        childId: "explorer",
      })
      .firestore();
    await assertSucceeds(
      getDoc(doc(db, "families/parent-a/children/explorer")),
    );
    await assertFails(getDoc(doc(db, "families/parent-a/children/sibling")));
    await assertFails(getDocs(collection(db, "families/parent-a/children")));
  });
  it("denies all direct balance, reward and approval writes for both roles", async () => {
    for (const ctx of [
      env.authenticatedContext("parent-a", { parent: true }),
      env.authenticatedContext("child-a", {
        student: true,
        parentUid: "parent-a",
        childId: "explorer",
      }),
    ]) {
      await assertFails(
        setDoc(doc(ctx.firestore(), "families/parent-a/children/explorer"), {
          balance: 100000,
          role: "parent",
        }),
      );
    }
  });
  it("denies answer-key and idempotency receipt reads for all clients", async () => {
    for (const ctx of [
      env.authenticatedContext("parent-a", { parent: true }),
      env.authenticatedContext("child-a", {
        student: true,
        parentUid: "parent-a",
        childId: "explorer",
      }),
    ])
      for (const path of ["private/session", "operations/id"])
        await assertFails(
          getDoc(
            doc(ctx.firestore(), `families/parent-a/children/explorer/${path}`),
          ),
        );
  });
});
