# Firebase Spark deployment and operations

Math Quest now uses **Firebase Hosting + email/password Authentication + Cloud Firestore on Spark**. No Cloud Functions, Admin SDK service account, billing account, or paid infrastructure is required by the live application. `functions/` and `src/lib/firebase.ts` are retained legacy scaffolding only; the production Firebase configuration has no Functions deployment target.

## Current project

- Project: `math-quest-2d6e5`; default Standard/Native Firestore in `us-central1`.
- Web app: `1:770154018698:web:4a5b061e001c581be4ba73`.
- Hosting: `https://math-quest-2d6e5.web.app`.
- Public SDK fields live in ignored `.env.local`; no Admin SDK keys are used by the browser.
- `.firebaserc` is local and ignored. Every deployment command below names its project explicitly.
- The deployment outcome and executed checks are recorded in VALIDATION.md. Merely building this repository does not confirm a cloud deployment.

## First family setup

1. Open the hosted app, select **Parent sign-in & setup**, then **Create a parent account**. Enter your own email/password; the app requests at least 12 characters. Open the verification email and return to **I've verified my email**. Only verified password accounts can act as parents. No public child PIN or front-end role flag grants parent authority.
2. Create a child profile with a nickname only. Choose whether to explicitly approve the three sample family rewards. New cloud profiles start at zero coins; local demo saves are never imported as trusted financial or mastery data.
3. Select **Approve this device & let's play**. The browser has a separate anonymous Auth identity for the child. Your verified parent writes a binding for that exact identity, then signs out of parent Authentication before the child adventure opens.
4. Child approval lasts 30 days. Parent credentials use memory-only persistence, are cleared on page reload/sign-out, and the parent interface locks after 15 minutes. Rules additionally reject parent sessions older than one hour. The child identity persists on the approved browser, but cannot read or change parent/device administration.
5. To use another tablet/browser, sign in as the same parent there and approve that device. Both devices share the same family profile. Use **Approved devices** in parent controls to revoke a device. Revocation/expiry is enforced on every server operation; the UI checks the binding too.

Password reset and verification resend are available. Email delivery is performed by Firebase; real inbox delivery and physical-device acceptance require the account owner's review. Browser automation uses synthetic emulator accounts only, never a real parent password.

## Data and authority

`firestore.spark.rules` is the deployed schema's authority. The old `firestore.rules` tests remain as regression coverage for the locked legacy schema. All unspecified paths and all deletes are denied.

- `familiesV2/{parentUid}/children/explorer`: nickname, validated appearance, savings goal, parent learning settings and creation timestamp.
- Subcollections: `wallet/current`, `runtime/current`, `progress/{skill}`, `facts/{canonicalFact}`, `sessions/{sessionId}`, immutable `attempts`, immutable `events`, immutable `ledger`, parent-managed `rewards`, and reversible `requests`.
- `sparkDevices/{anonymousUid}`: parent-owned family binding with expiry and revocation. Anonymous sign-in by itself grants no family access. Ownership uses authenticated UIDs and token provider/verification claims, not client-supplied role properties.

For each answer, rules validate the saved question, arithmetic, hint/retry counters, one-time attempt, allowed coin delta, server UTC day, daily cap and per-skill/difficulty five-credit bucket. Wallet, immutable ledger, attempt, session, permanent skill progress and fact evidence must agree in one atomic transaction. Questions cannot be changed after issue, and each ten-question session contains distinct commutative fact families. Active sessions retain their parent's curriculum snapshot. Progress/mastery updates are validated independently of spendable coins. The selected question and coin amounts are proposals until the server accepts the transaction.

Question scheduling and word-problem rendering remain deterministic client code. Rules validate allowed operands, level, plan and non-repetition; they do **not** duplicate the entire history-ranking scheduler or establish that a human solved the question. A modified client can automate valid practice or choose another eligible fact. Earning caps still apply, and neither a Functions architecture nor rules can prove human effort. No competitive/high-stakes anti-cheat claim is made.

Requests atomically reserve the saved reward price and increment usage. Only the owning verified parent can approve, fulfill, or decline. Decline refunds the original reserved cost exactly once and restores quantity capacity. Fulfilled requests cannot be refunded. Parent coin adjustments require a nonzero bounded integer and a reason, with a matching ledger record and nonnegative wallet. All balance mutations are validated on the server; no local balance is uploaded as authority.

History lives in subcollections, avoiding an ever-growing family state document. Parent history and requests load 100 records per collection per page with a **Load older history & requests** action, including older unfulfilled requests. Displayed accuracy/history reflects loaded evidence; skill mastery and stars are permanent server-validated aggregates. The opening-balance ledger display reconciles older unloaded entries and is not a writable award. Fact evidence and four skill aggregates survive reloads independently of the current history page. The scheduler loads the newest 1,000 canonical fact summaries (enough for every multiplication family); older summaries remain stored and update transactionally when revisited.

## Local development and checks

Default `.env.example` mode is the isolated local demo. For cloud emulator QA, supply mode `firebase`, emulator flag `true`, and a `demo-` project. Emulators are allowed only on localhost. Do not point synthetic tests at the live project.

```powershell
npm.cmd ci
npm.cmd run firebase:rules:test
npm.cmd run firebase:emulators
npm.cmd test
npm.cmd run typecheck
npm.cmd run build
```

`firebase:rules:test` launches only Firestore under an explicit demo project and runs legacy plus Spark security tests. Browser account tests additionally use the local Auth emulator. Java 21+ is required for Firestore. Emulator tests do not prove physical-device behavior or real verification/reset email delivery.

## Build and publish

1. Complete `.env.local` from the registered web app's public SDK configuration. Keep it ignored. The deployed app uses only API key, auth domain, project ID and app ID; it does not initialize Analytics.
2. Run the tests above, then `npm.cmd run build:cloud`. This forces live mode and disables emulator connections for that build. It rejects missing configuration and demo project IDs.
3. Publish only the Spark services:

```powershell
npm.cmd run build:cloud
npm.cmd exec firebase -- deploy --only auth,firestore:rules,hosting --project math-quest-2d6e5
```

The Auth config enables email/password and anonymous identities; family access still requires parent-approved bindings. The Hosting CSP permits the Auth token/identity APIs and Firestore only. Verify HTTPS rendering, sign-in, deployed rules, anonymous denial and the browser console after release. Do not enable billing or deploy legacy Functions as a workaround.

The Spark application is published at the Hosting address above. All six hosted files were verified byte-for-byte against the cloud build, and the released rules matched local source. Both Auth providers are enabled and the billing check returned `false`. Firebase's reserved email-action pages are served by Firebase itself; their own handler is separate from the SPA. Real account creation, inbox verification, password-reset delivery and physical child-device acceptance remain owner steps.

## Free-plan limits and GitHub

Spark has usage quotas. Hosting traffic, Auth activity, rule document lookups, listeners, history queries and transactions all consume their respective quotas. Reaching a Spark limit can stop service; this is not unlimited free hosting. Billing remains disabled, so this implementation must not silently upgrade to Blaze. No exact capacity or future pricing guarantee is made. Check the Firebase console for usage.

The app is backed up on `codex/math-quest-firebase`, the verified default/release branch. The updated GitHub Actions workflow validates tests, the Hosting verifier, typecheck, builds and emulator rules on pushes/PRs. Successful release-branch pushes can then perform a cloud build, keyless Google authentication, Hosting-only publication and byte-for-byte release verification. Pull requests and other branches never publish. Manual runs on the release branch are also supported.

**Activation is pending:** this workflow change has not been pushed, and the dedicated Google Cloud identity and GitHub `production` variables have not been configured or tested remotely. [GITHUB-DEPLOYMENT.md](GITHUB-DEPLOYMENT.md) contains the exact one-time connection recipe, scoped IAM roles and repository/workflow/branch trust conditions. Auth/rules/indexes and legacy Functions are outside this automated publication job; billing is unchanged.

Official references: [Spark pricing](https://firebase.google.com/pricing), [atomic rules validation](https://firebase.google.com/docs/firestore/security/rules-conditions), [Auth persistence](https://firebase.google.com/docs/auth/web/auth-state-persistence), [anonymous identities](https://firebase.google.com/docs/auth/web/anonymous-auth).
