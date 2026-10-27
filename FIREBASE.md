# Firebase integration handoff — not deployed

The working product is local demo mode. **No Firebase project, credentials, parent account, hosting deployment, trusted child session or live approval system has been created.** `VITE_APP_MODE=firebase` displays a setup lock. Do not remove that guard until the gates below pass. Never migrate local demo balances into live money-like state as trusted data.

## What is prepared

- Firebase Hosting configuration for a Vite SPA and security headers. The shipped CSP permits only local connections, intentionally suitable for demo hosting. Live Auth/Firestore/Functions/App Check origins need a narrowly scoped CSP update and browser verification before live integration.
- An `.env.example` with public web-app configuration fields. No Admin SDK keys belong in frontend environment variables, source control, or a Vite bundle. Use platform service identity for Functions.
- Lazy SDK initialization in `src/lib/firebase.ts`, including opt-in emulator connections. It is not called by the demo and is not a finished persistence adapter or login UI.
- Firestore rules: only an owning provisioned parent or a correctly bound student token may get a child state document. Only the parent may list their children. All direct client writes are denied. Answer keys and idempotency receipts are server-only, including for parent clients. Six emulator tests cover anonymous access, unprovisioned users, different families, sibling access, client writes, child list access and answer-key reads.
- `functions/src/index.ts`: a callable **integration scaffold**, not a production service. Auth and App Check are required. Parent ownership comes from server-issued custom claims, never request role flags. The function resolves the family and child from trusted claims for students. All state changes and operation receipts are in a Firestore transaction.

## Backend contract

`questCommand` accepts `{action, operationId, ...payload}`. Use a cryptographically random stable operation ID per intended command; reuse it for network retries. Parent operations also include `childId`. A child caller's supplied family/child IDs are ignored. Never send a balance or an award amount from the student client.

| Action          | Caller                  | Payload / behavior                                                                                                                          |
| --------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `initialize`    | Parent                  | `nickname`; initialize this parent's child at zero coins                                                                                    |
| `start`         | Bound student or parent | `skill`; issue a server-seeded question, 24-hour session; no answer key returned                                                            |
| `resume`        | Bound student or parent | Retrieve active question and index                                                                                                          |
| `hint`          | Bound student or parent | `questionId`; record hint use before returning help                                                                                         |
| `answer`        | Bound student or parent | `questionId`, `answer` string; verify server question, store evidence, advance mastery, award bounded coins, issue next question atomically |
| `requestReward` | Bound student or parent | `rewardId`; validate inventory, balance and limits; reserve coins and create pending request atomically                                     |
| `resolveReward` | Parent                  | `requestId`, `resolution`: approve/decline/fulfill; refund once on valid decline                                                            |
| `adjustCoins`   | Parent                  | Whole `amount`, required `reason`; reject negative resulting balance                                                                        |
| `saveReward`    | Parent                  | Validated `reward` object; explicit approval/availability/archival flags and quantity limit                                                 |
| `settings`      | Parent                  | `nickname`, `dailyCap` 0–200, `weeklySessions` 1–14                                                                                         |

The scaffold uses `families/{parentUid}/children/{childId}` for a small bounded state document, `/private/session` for server answer keys, and `/operations/{operationId}` for idempotency receipts. It fails closed at 500 completed questions, 1,500 events, 1,000 ledger entries, or 100 requests. **Before production, move histories, ledger, requests, sessions and operation receipts into bounded subcollections with a transactional wallet/aggregate document, retention rules and pagination.** The limits are preparation safeguards, not a scalable final data model. Child reads currently expose their own family reward/learning state and adjustment reasons; split parent-only notes before introducing sensitive notes. Do not put PII in ledger reasons.

App Check is an abuse barrier, not authorization or proof that a human solved a math problem. Client secrecy cannot prevent using outside help. Server questions, authoritative timestamps, immutable ledger math, per-question idempotency and earning caps protect the economy. The server validates all operation inputs; backend emulator concurrency/replay tests are still required.

### Versioned learning plans

The parent-only `settings` command also accepts `curriculum: {focusSkill, enabledSkills, maxFactor, mode}`. `maxFactor` is an integer 5–12; mode is `adaptive` or `full-range`; the focus must be enabled. The server ignores a supplied revision and derives the next revision from the saved plan. Missing curriculum in the settings command preserves the saved curriculum for compatibility. Legacy documents without a curriculum migrate to multiplication-only through 12 × 12 without resetting the wallet or learning evidence.

`start` snapshots the validated server-owned plan, seed, current question and asked facts in the private session. `hint` and `answer` continue that snapshot even if the parent changes the saved plan. The shared deterministic scheduler excludes already-asked families, spaces recent facts, balances coverage and delayed tricky-fact review, and checks enabled skills when an adventure starts. Start/resume return the active plan and safe question metadata; completed sessions retain the plan/seed. Changing the plan does not reset daily earning buckets or permanent achievements. The same local unit tests exercise this shared scheduler; the modified callable wiring has been compiled, not executed against a live backend.

### Child-owned cosmetic preferences

The shared `State.appearance` contains only `outfit`, `accent`, `hat`, `glasses`, `move`, `sky`, `motion` and `voice`. The scaffold’s authenticated `appearance` command accepts `{action: 'appearance', operationId, appearance}` from the bound child or owning parent (a parent also supplies `childId` as usual). `changeAppearance` validates enum/boolean values, copies only these eight cosmetic fields and preserves the wallet, ledger, requests, mastery and learning plan. Additional fields such as roles, balances or learning settings cannot be carried through a cosmetic command. All direct Firestore writes remain denied. Legacy state receives default cosmetics; malformed cosmetics alone do not reset the learning/economy state. UI motion preferences are cosmetic, not authorization or security controls. This command is prepared and compiled only; Firebase mode and production deployment remain disabled.

## Setup and security gates

1. Create a Firebase project yourself; choose a region, enable parent Authentication (such as email/password) and Firestore in locked mode. Enable an appropriate App Check provider. Keep the console account and billing under parent control.
2. Provision parent custom claims only through a trusted Admin workflow after ownership is established: `{parent: true}`. No browser write, sign-up form role, nickname, public PIN, or mutable Firestore role flag may grant this claim.
3. Implement and test real parent sign-in, sign-out and recent reauthentication for entry to parent tools. A student must use a distinct, restricted identity provisioned only after the authenticated parent approves a device/session. A trusted provisioning endpoint should issue `{student: true, parentUid, childId}` custom claims/token, with revocation, expiry and device management. Do not leave parent credentials or an active parent session available in the student view. **The provisioning endpoint and authenticated frontend are not implemented yet.**
4. Replace demo persistence with a live repository adapter: server read subscription and callable commands only. Student bundles must not issue local awards. Strip server answer keys from active question responses. Connect App Check initialization before calling enforced functions. Add a parent-only savings/reward administration surface and a student-safe goal setter (the scaffold does not yet expose a goal command).
5. Migrate the bounded state model above, implement rate limits and retention/deletion/export, paginate learning records, and add trusted bootstrap/claim-revocation operational procedures. Avoid promising offline financial writes; replay only an idempotent operation, never a local balance.
6. Run local emulators, rule tests, and authenticated callable tests: parent/student/anonymous/other-family authorization, forged role and balance fields, stale sessions, question replay, simultaneous spend, inventory races, double refund, award cap at UTC rollover, malformed inputs, and idempotent network retries. Test sign-out/revocation and App Check enforcement in staging. Existing rule tests and domain tests do **not** prove these end-to-end properties.
7. Only after those gates, connect the frontend and replace the Firebase setup lock with the authenticated application. Verify a staging build never displays the demo parent route, and verify Firestore rules against the exact deployed schema.

## Local emulator commands

Use Node 22 for the functions runtime and Java 21+ for Firestore.

```powershell
npm.cmd ci
npm.cmd ci --prefix functions
npm.cmd run functions:build
npm.cmd run firebase:rules:test
npm.cmd run firebase:emulators
```

These scripts explicitly use `demo-math-quest`, so they do not create production resources. The test suite seeds records via the emulator's rules-disabled admin context, never a live database. The Functions emulator uses the compiled backend; compile before launching it. App Check debugging must use an explicitly configured local/staging debug token, never disable production enforcement as a workaround.

## Eventual hosting and backend deployment

Deploying Cloud Functions requires the **Blaze (pay-as-you-go) plan**; usage, build artifacts and associated cloud services can incur charges. Hosting a static demo alone does not supply authoritative operations. Review current pricing and set budget alerts before enabling billing. Budget alerts are not hard spend caps. No paid infrastructure was enabled by this project.

Once you intentionally have a project and have passed the gates, use `firebase login`, then `firebase use --add` to select your actual project. Copy `.env.example` to `.env.local` and fill only the public web-app fields. Configure authorized domains, App Check, server region and narrowly scoped live CSP connections. Use the project's CLI through `npx firebase` (or `npm exec firebase -- …`).

```powershell
# Static DEMO only, if intentionally publishing the local simulation:
npm.cmd run build
npx.cmd firebase deploy --only hosting --project YOUR_REAL_PROJECT_ID

# For a verified future live implementation, deploy rules/functions before its frontend:
npm.cmd run functions:build
npx.cmd firebase deploy --only firestore:rules,functions --project YOUR_REAL_PROJECT_ID
# Then build/deploy the fully integrated, verified frontend separately.
```

`YOUR_REAL_PROJECT_ID` is a placeholder, not a credential or configured project. Hosting the current demo must retain every demo disclosure. No deployment has been run or claimed.

Official references: [Callable functions and auth context](https://firebase.google.com/docs/functions/callable), [Security rule conditions and authentication](https://firebase.google.com/docs/firestore/security/rules-conditions), [Custom claims](https://firebase.google.com/docs/auth/admin/custom-claims), [Functions runtime management](https://firebase.google.com/docs/functions/manage-functions), [Functions setup and billing](https://firebase.google.com/docs/functions/get-started), [Firebase pricing](https://firebase.google.com/pricing).
