import { getApp, getApps, initializeApp } from "firebase/app";
import {
  browserLocalPersistence,
  connectAuthEmulator,
  getAuth,
  inMemoryPersistence,
  initializeAuth,
} from "firebase/auth";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";

let instance: ReturnType<typeof create> | null = null;
function create() {
  const e = import.meta.env;
  if (
    !e.VITE_FIREBASE_API_KEY ||
    !e.VITE_FIREBASE_APP_ID ||
    !e.VITE_FIREBASE_PROJECT_ID ||
    !e.VITE_FIREBASE_AUTH_DOMAIN
  )
    throw new Error(
      "Firebase configuration is incomplete. Please contact your parent.",
    );
  const config = {
    apiKey: e.VITE_FIREBASE_API_KEY,
    appId: e.VITE_FIREBASE_APP_ID,
    projectId: e.VITE_FIREBASE_PROJECT_ID,
    authDomain: e.VITE_FIREBASE_AUTH_DOMAIN,
  };
  const learnerFresh = !getApps().some((a) => a.name === "quest-learner"),
    parentFresh = !getApps().some((a) => a.name === "quest-parent");
  const learnerApp = learnerFresh
    ? initializeApp(config, "quest-learner")
    : getApp("quest-learner");
  const parentApp = parentFresh
    ? initializeApp(config, "quest-parent")
    : getApp("quest-parent");
  const learnerAuth = learnerFresh
    ? initializeAuth(learnerApp, { persistence: browserLocalPersistence })
    : getAuth(learnerApp);
  const parentAuth = parentFresh
    ? initializeAuth(parentApp, { persistence: inMemoryPersistence })
    : getAuth(parentApp);
  const learnerDb = getFirestore(learnerApp),
    parentDb = getFirestore(parentApp);
  if (e.VITE_FIREBASE_EMULATORS === "true") {
    if (!["localhost", "127.0.0.1"].includes(location.hostname))
      throw new Error("Emulators are permitted only on localhost.");
    if (learnerFresh) {
      connectAuthEmulator(learnerAuth, "http://127.0.0.1:9099", {
        disableWarnings: true,
      });
      connectFirestoreEmulator(learnerDb, "127.0.0.1", 8080);
    }
    if (parentFresh) {
      connectAuthEmulator(parentAuth, "http://127.0.0.1:9099", {
        disableWarnings: true,
      });
      connectFirestoreEmulator(parentDb, "127.0.0.1", 8080);
    }
  }
  return { learnerAuth, parentAuth, learnerDb, parentDb };
}
export function cloudFirebase() {
  return (instance ??= create());
}
