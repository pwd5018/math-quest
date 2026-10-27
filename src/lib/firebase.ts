// Preparation only. App.tsx deliberately locks Firebase mode until integration is verified.
// Importing this module does not initialize Firebase or contact a server.
export async function connectFirebase() {
  const env = import.meta.env;
  if (
    !env.VITE_FIREBASE_API_KEY ||
    !env.VITE_FIREBASE_PROJECT_ID ||
    !env.VITE_FIREBASE_AUTH_DOMAIN ||
    !env.VITE_FIREBASE_APP_ID
  )
    throw new Error("Missing Firebase web configuration.");
  const [
    { initializeApp, getApps },
    { getAuth, connectAuthEmulator },
    { getFirestore, connectFirestoreEmulator },
    { getFunctions, connectFunctionsEmulator, httpsCallable },
  ] = await Promise.all([
    import("firebase/app"),
    import("firebase/auth"),
    import("firebase/firestore"),
    import("firebase/functions"),
  ]);
  const fresh = getApps().length === 0;
  const app =
    getApps()[0] ||
    initializeApp({
      apiKey: env.VITE_FIREBASE_API_KEY,
      authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: env.VITE_FIREBASE_PROJECT_ID,
      appId: env.VITE_FIREBASE_APP_ID,
    });
  const auth = getAuth(app),
    db = getFirestore(app),
    functions = getFunctions(app, "us-central1");
  if (fresh && env.VITE_FIREBASE_EMULATORS === "true") {
    connectAuthEmulator(auth, "http://127.0.0.1:9099");
    connectFirestoreEmulator(db, "127.0.0.1", 8080);
    connectFunctionsEmulator(functions, "127.0.0.1", 5001);
  }
  return { auth, db, command: httpsCallable(functions, "questCommand") };
}
