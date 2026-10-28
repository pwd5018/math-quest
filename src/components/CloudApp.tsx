import { useEffect, useRef, useState } from "react";
import {
  createUserWithEmailAndPassword,
  getIdToken,
  onAuthStateChanged,
  reload,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInAnonymously,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import App, { type CloudBridge } from "../App";
import { Fox } from "./Art";
import { cloudFirebase } from "../lib/cloudFirebase";
import { CloudRepository } from "../lib/cloudRepository";
import { CHILD_ID } from "../lib/cloudModel";
import type { State } from "../lib/economy";
import "./cloud.css";

type Device = { id: string; expiresAt: Timestamp; revoked: boolean };
function message(e: unknown) {
  const code = (e as { code?: string }).code;
  const messages: Record<string, string> = {
    "auth/invalid-credential": "That email/password combination did not work.",
    "auth/email-already-in-use":
      "That email already has an account. Try signing in or resetting your password.",
    "auth/weak-password": "Choose a password with at least 12 characters.",
    "auth/too-many-requests": "Please take a short break and try again.",
    "permission-denied":
      "This session is not authorized, has expired, or the change could not be validated. Ask your parent to sign in again.",
    unavailable:
      "The cloud is temporarily unavailable. Reconnect and try again; unsaved answers have not earned coins.",
    "auth/network-request-failed":
      "Check your internet connection and try again.",
  };
  return (
    messages[code ?? ""] ??
    (e instanceof Error
      ? e.message
      : "Unable to complete this change. Please try again.")
  );
}
export default function CloudApp() {
  const [services] = useState(cloudFirebase);
  const [mode, setMode] = useState<
    "loading" | "welcome" | "auth" | "verify" | "setup" | "parent" | "student"
  >("loading");
  const [repo, setRepo] = useState<CloudRepository | null>(null),
    [state, setState] = useState<State | null>(null);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const [signup, setSignup] = useState(false),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [nickname, setNickname] = useState("Explorer"),
    [samples, setSamples] = useState(true);
  const [devices, setDevices] = useState<Device[]>([]),
    [revision, setRevision] = useState(0);
  const modeRef = useRef(mode);
  const opening = useRef(false);
  modeRef.current = mode;
  const stopRepo = useRef<() => void>(() => {}),
    stopDevice = useRef<() => void>(() => {}),
    repoRef = useRef<CloudRepository | null>(null);
  repoRef.current = repo;
  function clearRepository() {
    stopRepo.current();
    stopDevice.current();
    setRepo(null);
    setState(null);
  }
  async function openRepository(
    r: CloudRepository,
    next: "parent" | "student",
  ) {
    stopRepo.current();
    await r.reload();
    setRepo(r);
    setState({ ...r.state });
    setMode(next);
    stopRepo.current = r.subscribe(
      () => {
        setState({ ...r.state });
        setRevision((n) => n + 1);
      },
      (e) => {
        setError(message(e));
        if ((e as { code?: string }).code === "permission-denied") {
          clearRepository();
          setMode("welcome");
        }
      },
    );
  }
  async function resumeLearner() {
    const user = services.learnerAuth.currentUser;
    if (!user) {
      setMode("welcome");
      return;
    }
    const ref = doc(services.learnerDb, "sparkDevices", user.uid),
      snap = await getDoc(ref);
    if (
      !snap.exists() ||
      snap.data().revoked ||
      snap.data().expiresAt.toMillis() <= Date.now()
    ) {
      setMode("welcome");
      return;
    }
    const binding = snap.data();
    await openRepository(
      new CloudRepository(
        services.learnerDb,
        binding.parentUid,
        binding.childId,
      ),
      "student",
    );
    stopDevice.current = onSnapshot(
      ref,
      (d) => {
        if (
          !d.exists() ||
          d.data().revoked ||
          d.data().expiresAt.toMillis() <= Date.now()
        ) {
          clearRepository();
          setMode("welcome");
          setNotice("This device needs a fresh parent approval.");
        }
      },
      (e) => {
        setError(message(e));
        clearRepository();
        setMode("welcome");
      },
    );
  }
  useEffect(() => {
    const unsub = onAuthStateChanged(services.learnerAuth, () => {
      if (modeRef.current === "loading" && !opening.current) {
        opening.current = true;
        void resumeLearner()
          .catch((e) => {
            setError(message(e));
            setMode("welcome");
          })
          .finally(() => {
            opening.current = false;
          });
      }
    });
    const interval = setInterval(() => {
      const r = repoRef.current;
      if (
        modeRef.current === "student" &&
        r &&
        services.learnerAuth.currentUser
      ) {
        void getDoc(
          doc(
            services.learnerDb,
            "sparkDevices",
            services.learnerAuth.currentUser.uid,
          ),
        )
          .then((d) => {
            if (
              !d.exists() ||
              d.data().revoked ||
              d.data().expiresAt.toMillis() <= Date.now()
            ) {
              clearRepository();
              setMode("welcome");
            }
          })
          .catch(() => {});
      }
    }, 60000);
    return () => {
      unsub();
      clearInterval(interval);
      stopRepo.current();
      stopDevice.current();
    };
    // Services are initialized once; the auth listener handles the initial persisted child identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [services]);
  useEffect(() => {
    if (mode !== "parent" && mode !== "setup") return;
    const timer = setTimeout(
      () => {
        void leaveParent();
        setNotice("Parent access has locked. Sign in again to continue.");
      },
      15 * 60 * 1000,
    );
    return () => clearTimeout(timer);
  }, [mode]);
  async function execute<T>(fn: () => Promise<T>): Promise<T | undefined> {
    if (busy) return;
    setBusy(true);
    repoRef.current?.pause(true);
    setError("");
    try {
      const result = await fn();
      const current = repoRef.current;
      if (current) {
        setState({ ...current.state });
        setRevision((n) => n + 1);
      }
      return result;
    } catch (e) {
      setError(message(e));
      return undefined;
    } finally {
      repoRef.current?.pause(false);
      setBusy(false);
    }
  }
  async function parentReady() {
    const user = services.parentAuth.currentUser;
    if (!user) return;
    await reload(user);
    await getIdToken(user, true);
    if (!user.emailVerified) {
      setMode("verify");
      return;
    }
    const r = new CloudRepository(services.parentDb, user.uid);
    if (!(await r.exists())) {
      setRepo(r);
      setMode("setup");
      return;
    }
    await openRepository(r, "parent");
    const list = await getDocs(
      query(
        collection(services.parentDb, "sparkDevices"),
        where("parentUid", "==", user.uid),
      ),
    );
    setDevices(list.docs.map((d) => ({ id: d.id, ...d.data() })) as Device[]);
  }
  async function authenticate(e: React.FormEvent) {
    e.preventDefault();
    await execute(async () => {
      try {
        if (signup) {
          if (password.length < 12)
            throw new Error("Choose a password with at least 12 characters.");
          const credential = await createUserWithEmailAndPassword(
            services.parentAuth,
            email.trim(),
            password,
          );
          await sendEmailVerification(credential.user);
          setNotice("Check your inbox for your verification link.");
        } else
          await signInWithEmailAndPassword(
            services.parentAuth,
            email.trim(),
            password,
          );
        setPassword("");
        await parentReady();
      } finally {
        setPassword("");
      }
    });
  }
  async function leaveParent() {
    await signOut(services.parentAuth);
    clearRepository();
    setMode("welcome");
  }
  async function approveDevice() {
    const parent = services.parentAuth.currentUser;
    if (!parent || !repo) throw new Error("Sign in as a parent first.");
    await services.learnerAuth.authStateReady();
    const learner =
      services.learnerAuth.currentUser ??
      (await signInAnonymously(services.learnerAuth)).user;
    const ref = doc(services.parentDb, "sparkDevices", learner.uid),
      old = await getDoc(ref);
    const expiresAt = Timestamp.fromMillis(Date.now() + 30 * 86400000);
    if (old.exists()) {
      if (old.data().parentUid !== parent.uid)
        throw new Error(
          "This browser is already linked to a different family. Use a separate browser profile.",
        );
      await updateDoc(ref, { revoked: false, expiresAt });
    } else
      await setDoc(ref, {
        parentUid: parent.uid,
        childId: CHILD_ID,
        expiresAt,
        revoked: false,
        createdAt: serverTimestamp(),
      });
    await signOut(services.parentAuth);
    clearRepository();
    await resumeLearner();
  }
  function parentEntry() {
    clearRepository();
    setPassword("");
    setError("");
    setMode("auth");
  }
  if (repo && state && (mode === "parent" || mode === "student")) {
    const bridge: CloudBridge = {
      state,
      repo,
      parent: mode === "parent",
      revision,
      onParent: parentEntry,
      onLeave: () => void execute(leaveParent),
      onChange: async (fn) => execute(fn),
    };
    bridge.parentControls = (
      <>
        {" "}
        {mode === "parent" && (
          <section
            className="cloud-family-bar"
            aria-label="Parent session controls"
          >
            <span>Verified parent · access locks after 15 minutes</span>
            <button
              className="primary"
              disabled={busy}
              onClick={() => void execute(approveDevice)}
            >
              Approve this device &amp; let’s play
            </button>
            <button
              className="text-link"
              disabled={busy}
              onClick={() => void execute(leaveParent)}
            >
              Lock parent access
            </button>
            <details>
              <summary>Approved devices ({devices.length})</summary>
              {devices.map((d) => (
                <div key={d.id}>
                  Device …{d.id.slice(-6)} ·{" "}
                  {d.revoked
                    ? "Revoked"
                    : `Expires ${d.expiresAt.toDate().toLocaleDateString()}`}{" "}
                  <button
                    className="text-link"
                    disabled={busy || d.revoked}
                    onClick={() =>
                      void execute(async () => {
                        await updateDoc(
                          doc(services.parentDb, "sparkDevices", d.id),
                          { revoked: true },
                        );
                        setDevices((ds) =>
                          ds.map((x) =>
                            x.id === d.id ? { ...x, revoked: true } : x,
                          ),
                        );
                      })
                    }
                  >
                    Revoke access
                  </button>
                </div>
              ))}
            </details>
          </section>
        )}{" "}
      </>
    );
    return (
      <>
        <fieldset
          className="cloud-app-fieldset"
          disabled={busy}
          aria-busy={busy}
        >
          <App key={`${mode}-${repo.owner}`} cloud={bridge} />
        </fieldset>
        {busy && (
          <div className="cloud-saving" role="status">
            Saving securely…
          </div>
        )}
        {error && (
          <div className="cloud-error" role="alert">
            {error}
            <button onClick={() => setError("")} aria-label="Dismiss error">
              ×
            </button>
          </div>
        )}
      </>
    );
  }
  return (
    <main className="cloud-entry">
      <section className="cloud-entry-card">
        <div className="cloud-entry-art">
          <Fox />
          <span>mathquest.</span>
        </div>
        {mode === "loading" ? (
          <>
            <h1>Finding your adventure…</h1>
            <p>Connecting to your family’s cloud save.</p>
          </>
        ) : (
          <>
            <div className="eyebrow">A LITTLE PRACTICE. A BIG ADVENTURE.</div>
            <h1>
              {mode === "auth"
                ? signup
                  ? "Your family’s adventure starts here"
                  : "Welcome back, grown-up"
                : mode === "verify"
                  ? "One little check for your grown-up"
                  : mode === "setup"
                    ? "Meet your little explorer"
                    : "Ready for a little wonder?"}
            </h1>
            {mode === "welcome" && (
              <>
                <p>
                  A parent sets up this device once. Then your explorer can
                  return to their own saved adventure.
                </p>
                <button
                  className="primary"
                  disabled={busy}
                  onClick={parentEntry}
                >
                  Parent sign-in &amp; setup
                </button>
                <button
                  className="secondary"
                  disabled={busy}
                  onClick={() => void execute(resumeLearner)}
                >
                  Continue child adventure
                </button>
                <small>
                  No ads. Nickname only for your child. Parent login stays
                  separate.
                </small>
              </>
            )}
            {mode === "auth" && (
              <form onSubmit={authenticate}>
                <label>
                  Your email
                  <input
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </label>
                <label>
                  Password
                  <input
                    type="password"
                    autoComplete={signup ? "new-password" : "current-password"}
                    required
                    minLength={signup ? 12 : 1}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </label>
                <button className="primary" disabled={busy}>
                  {signup ? "Create parent account" : "Sign in securely"}
                </button>
                <button
                  type="button"
                  className="text-link"
                  disabled={busy}
                  onClick={() => {
                    setSignup(!signup);
                    setPassword("");
                  }}
                >
                  {signup
                    ? "Already have an account? Sign in"
                    : "New here? Create a parent account"}
                </button>
                <button
                  type="button"
                  className="text-link"
                  disabled={busy || !email.trim()}
                  onClick={() =>
                    void execute(async () => {
                      await sendPasswordResetEmail(
                        services.parentAuth,
                        email.trim(),
                      );
                      setNotice(
                        "If that address has an account, a reset email is on its way.",
                      );
                    })
                  }
                >
                  Forgot password?
                </button>
              </form>
            )}
            {mode === "verify" && (
              <>
                <p>
                  Open the verification email, then return here. Only verified
                  parents can create profiles or approve devices.
                </p>
                <button
                  className="primary"
                  disabled={busy}
                  onClick={() => void execute(parentReady)}
                >
                  I’ve verified my email
                </button>
                <button
                  className="text-link"
                  disabled={busy}
                  onClick={() =>
                    void execute(async () => {
                      if (services.parentAuth.currentUser)
                        await sendEmailVerification(
                          services.parentAuth.currentUser,
                        );
                      setNotice("Verification email sent.");
                    })
                  }
                >
                  Resend verification email
                </button>
              </>
            )}
            {mode === "setup" && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void execute(async () => {
                    if (!repo) return;
                    await repo.initialize(nickname, samples);
                    await parentReady();
                  });
                }}
              >
                <label>
                  Child’s nickname
                  <input
                    required
                    maxLength={24}
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                  />
                </label>
                <label className="cloud-check">
                  <input
                    type="checkbox"
                    checked={samples}
                    onChange={(e) => setSamples(e.target.checked)}
                  />
                  I approve the three sample family rewards (movie, picnic and
                  game night). I can edit them.
                </label>
                <p>
                  Starts at zero coins. Existing demo progress stays separate.
                </p>
                <button className="primary" disabled={busy}>
                  Create our cloud adventure
                </button>
              </form>
            )}
            {mode !== "welcome" && (
              <button
                className="text-link"
                disabled={busy}
                onClick={() => void execute(leaveParent)}
              >
                Back &amp; lock parent access
              </button>
            )}
          </>
        )}
        {notice && (
          <p className="cloud-notice" role="status">
            {notice}
          </p>
        )}
        {error && (
          <p className="cloud-inline-error" role="alert">
            {error}
          </p>
        )}
        <footer>Family cloud save · Free Firebase Spark plan</footer>
      </section>
    </main>
  );
}
