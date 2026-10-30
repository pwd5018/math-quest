# Math Quest

A little practice. A big adventure. A responsive, third-grade math adventure made with React, TypeScript, Vite and Tailwind CSS. Original SVG world art and a real-time 3D Pip are bundled locally; no ads, AI APIs, external fonts, paid content, analytics or tracking.

## Family cloud version — Firebase Spark

The cloud version uses Firebase Hosting, email/password Authentication and Firestore security rules/transactions. It needs no Cloud Functions or billing account. Parent sign-in and email verification authorize a private family profile; a parent approves a separate anonymous identity on each child browser, then signs out of parent access. Parent access locks after 15 minutes; child approvals expire after 30 days and can be revoked. No public PIN or front-end role flag grants parent access.

The cloud app is configured for `math-quest-2d6e5`. See [FIREBASE.md](FIREBASE.md) for setup, security design, free-plan limits and the current deployment evidence in [VALIDATION.md](VALIDATION.md). The GitHub workflow supports validation followed by automatic Hosting-only publication from `codex/math-quest-firebase`, once the one-time keyless deployment identity and production variables are configured. See [GITHUB-DEPLOYMENT.md](GITHUB-DEPLOYMENT.md). Hosting automation is active and its first successful release is recorded in VALIDATION.md. Rules/Auth deployment remains separate; the new play-area/pack update is not yet published.

## Run locally

Requires Node 22.12+ (Node 24 also works for the local app), npm and a modern browser.

```powershell
npm.cmd ci
Copy-Item .env.example .env.local
npm.cmd run dev
```

Open the URL Vite prints. Default is `http://localhost:5173`. No Firebase account or credentials are needed. On macOS/Linux, use `npm` instead of `npm.cmd`.

**The default local mode is a functional LOCAL DEMO.** It stores fictional learning and reward data in this browser's localStorage. It has no cross-device sync, tamper resistance, secure parent authentication or secure approvals. The grown-up corner explicitly discloses this before opening. Cloud mode (`VITE_APP_MODE=firebase`) opens the authenticated family application instead; its database writes require the deployed Spark rules. Cloud profiles start at zero and never trust imported demo balances or mastery. See [FIREBASE.md](FIREBASE.md).

## Try the complete vertical slice

1. Choose **Mountain Peaks** or press **Let’s go** to practice multiplication through **12 × 12**, the default learning focus. Other trails are paused until enabled by the parent. An adventure has ten questions and no timer; gentle progression starts with small facts.
2. Answer independently, request a hint, or try again. Mistakes get number-line or equal-group help. After two incorrect submissions, a worked solution appears. Coins reward successful independent practice (3) and perseverance (1), without deductions for mistakes. Hints never block progress or stars.
3. Finish an adventure to see a celebration. Explore the treasure shop and choose a savings goal. Sample rewards are family movie night (30), a park picnic (60), and family game night (40). New saves begin at **zero coins**, without invented prior achievements.
4. Request an affordable reward. Its price is immediately reserved in one local state update. The request remains visible while waiting for the grown-up.
5. Open **Grown-up corner → Open demo parent preview**. Review progress and question evidence. Approve a request, then fulfill it, or decline it to refund the exact original price. Approved, unfulfilled requests are also reversible. Fulfilled rewards are final. Repeated refunds are rejected.
6. Use Reward inventory to create, edit, approve/unapprove, enable/disable, archive/restore, or limit a reward. Only approved and unarchived items appear in the student shop; unavailable ones cannot be requested. Limits count pending, approved and fulfilled requests; a refund restores request capacity. Existing requests retain their original title and price when inventory changes.
7. Coin ledger supports signed, whole-number adjustments with a required reason and no negative balances. To explore redemption immediately, make an explicit demo parent award with a reason. **Learning goals** controls active skills, the main focus, the multiplication limit (5–12), gentle/full-range difficulty, nickname, weekly adventure goal, and daily practice coin cap. Save the plan to apply it to the next adventure; a running adventure keeps its original settings and question.
8. Open **Pip’s dressing room** (or **Dress up Pip** on the map) for the child’s own settings. Pick a woodland explorer, starry wizard, space adventurer or puddle-jumper outfit; choose an accent color, cap/crown/daisy, glasses, and a happy-hop, fox-twirl, star-shower, happy-dance or little-hello move. Change the world to sunny day, peachy sunset or starlight. These everyday looks and basic accessories are free; optional special packs below use parent-configured coin prices. Wearing an owned costume never costs coins.

## A playful companion, at a comfortable pace

**Play with Pip** opens a larger React Three Fiber clearing with an orbiting camera, petting, fetch, bubbles and dancing. Choose Woodland clearing, Wizard glade, Rainy garden or Moon camp. Pip varies watching, sniffing, stretching, wandering and sitting, with bounded, session-seeded behavior. Buttons provide alternatives to direct scene interaction, including popping bubbles and turning/resetting the camera. The main scene pauses offscreen and when the document is hidden; Still/reduced-motion keeps it static. These activities never earn or spend coins.

**Pip’s special costume packs** adds six packs with four modeled costumes each: Halloween, Enchanted woodland, Cosmic explorers, Ocean adventures, Cozy little days and Winter wonder. Halloween includes pumpkin, witch, friendly ghost and vampire looks. In **Grown-up corner → Costume packs**, set a whole-coin price and open each pack. New packs start closed; a configured price of 0 is explicitly free. Buying a pack is an immediate, one-time wardrobe purchase with confirmation, not a family reward request or savings goal. Prices are checked again during purchase. Ownership persists after price changes or closing the pack; wearing costumes is free. The four everyday outfits, basic accessories and special moves remain free.

Cloud pack purchases use an atomic wallet/ledger/ownership transaction checked by `firestore.spark.rules`. Pack configuration is parent-only; ownership is immutable and required to equip a paid costume. See [FIREBASE.md](FIREBASE.md) for the required rules-first release sequence. Production publication was approved October 30, 2026; its security rules were deployed before the release-branch push.

Pip is a real-time Three.js character with dimensional geometry, lights, shadows, articulated poses and 3D outfits/accessories. Drag to turn Pip, or focus a companion button and use Left/Right; Home restores the front view. Clicking or Enter/Space plays the selected move. The same 3D character appears in the map, dressing room, profile and celebrations. One shared renderer serves the views and pauses those offscreen. If 3D is unavailable, a labeled illustrated fallback preserves play. See [GRAPHICS.md](GRAPHICS.md) for rendering and device-verification limits.

Pip hops and wanders around the map, pauses his route when hovered or keyboard-focused, and performs the selected special move when clicked or activated with Enter/Space. Original SVG clouds drift, tree canopies sway, water flows, birds glide and a butterfly flutters. The chosen outfit appears in the profile, sidebar, map, practice guide and answer celebrations. A successful answer brings a short, raised-paw Pip cheer into the feedback panel; hints and retries are celebrated too. The explanation and next-question control remain available during every animation. Cosmetic clicks never award practice coins or advance mastery.

The dressing room has an immediate live preview. A compact, sticky preview stays available while browsing settings on phones/tablets. Choices save in this browser alongside the existing demo; missing or invalid legacy cosmetics recover to a default appearance without resetting financial or learning data.

- **Playful:** slow world motion, wandering Pip, and short special-move/answer celebrations.
- **Calm:** stationary scenery and Pip, no particle effects, and a small wiggle for intentional moves/cheers.
- **Still:** no animated movement or transitions, including coin effects; outfits, static happy poses and written feedback still work.

The map’s pause/resume control switches between a quiet world and playful motion without opening settings. The device’s `prefers-reduced-motion` setting always overrides animation choices. Pip has a short locally synthesized creature squeak, played only after tapping Pip or the voice-preview button. Choose soft fox, chirpy, mellow, robot, woodland sprite or Off in the dressing room or play area; the header speaker mutes immediately and saves that choice. No microphone, speech service or audio download is used. There is no flashing effect, autoplay video, tracking or external image request. World artwork uses SVG/CSS, Pip uses real-time WebGL, and audio uses Web Audio. These are child-safe cosmetic preferences, separate from parent-only learning and economy controls.

The graphics upgrade adds layered terrain, shoreline depth, snowy peaks, shaded trees, mushroom cottages, a lighthouse, atmospheric motes, illustrated rewards and ribbon medals. Pip has dimensional fur-colored surfaces and clothing, blinking eyes, breathing, ear/tail motion and subtle pointer gaze. See [GRAPHICS.md](GRAPHICS.md) for rendering choices and future visual tiers.

## Hands-on discoveries and adventure endings

Request a hint (or try again after a wrong answer) to open interactive math tools. Multiplication supports tappable gems, equal groups and an array view; division shares gems equally one round at a time. Addition and subtraction use undoable number-line hops in ones, tens and hundreds, stopping exactly at the target distance. Reset starts the model again; changing questions clears it. The tools never enter or submit an answer. A requested hint remains recorded as support, including after a cloud reload.

Every completed adventure has an illustrated, trail-specific moment with Pip and highlights from that session's saved answers: independent answers, independent review questions, perseverance after mistakes and examples of independently solved facts. These scenes are free celebrations, without additional coins or mastery awards. Finishing moves focus to the summary and returns to the top so the scene is visible. Scene backgrounds are bundled SVG, with real-time 3D Pip using the existing appearance and motion settings.

## Learning and economy

- Multiplication uses factors **1 through 12**, including 11s, 12s, and 12 × 12 = 144. Parents can lower the maximum to any whole number from 5 through 12. Gentle progression uses up to 3 groups of 5, then 5 groups up to the configured limit, then the full configured range. Full-range mode starts with the entire selected range immediately. Addition/subtraction retain their ranges through 20, 100 and 1,000; exact division retains fact families through 10 × 10.
- Question rotation is a pure deterministic scheduler: **same seed + plan + level + structured history + facts already asked = same next question**. It never repeats a multiplication fact family within a ten-question adventure (6 × 7 and 7 × 6 share history). Orientation can change in later adventures. Exploration prioritizes unseen/less-practiced facts, then the least recent. Questions 3, 6 and 9 prioritize eligible tricky facts and use word problems. A wrong or hinted fact becomes reviewable after three intervening questions; no fact repeats within the current adventure. Two independent encounters clear its tricky flag. This is question-based review spacing, not a calendar-based spaced-repetition system.
- The full 12 × 12 range has 78 unique multiplication fact families when swapped factors share a family. The tests verify all 78, including 12 × 12, are reached before repeatedly practicing known facts in an all-independent full-range run. Difficulty and supported answers can change the actual review/exploration mix.
- Every effective parent curriculum change increments a revision. Active sessions freeze a copy of that plan. Question evidence carries its plan revision and multiplication limit; completed sessions retain the plan and seed. Reloading preserves saved settings and existing evidence. Legacy demo saves receive the multiplication-through-12 default without resetting coins, rewards, past history or permanent achievements; explicitly saved plans are respected on subsequent loads. Historical mastery badges are retained achievements, not certification that every fact in a newly expanded range has been mastered.
- Three consecutive independent completions advance a skill's difficulty. Supported answers reset that progression streak, never remove a level or achievement. A learner stays free to take hints and practice at their current trail.
- A permanent star is earned for each three independent completions in a skill, up to three stars. Mastery is separate: at least eight independent level-three completions across at least two distinct adventures. Easy high accuracy alone cannot grant mastery. Spending coins never affects achievements.
- A default **40 practice coins per UTC day**, plus at most **five rewarded questions per skill/difficulty/day**, bounds trivial-question farming. Supported completions earn one coin. A new day restores earning capacity; practice and mastery may continue when coin limits are reached. Manual parent awards are explicitly separate from practice earnings.
- Every answer submission and hint has a structured event. Completed questions additionally store skill, level, operands, deterministic answer, first answer, hint requests, retries, independence, session ID, timestamp and coins. The overview includes attempted but unfinished questions in independent accuracy. Completing ten questions records a session summary. In-progress question UI is not resumed after reload, but submitted evidence and earned coins remain.
- The local demo uses a single localStorage write per state change. It is designed for one active browser tab; it is **not a concurrent or authoritative database**. Storage failures produce a visible message. Invalid existing JSON is preserved until the next intentional state change. Clearing site data removes this browser's demo.

## Commands and architecture

| Command                           | Purpose                                                                |
| --------------------------------- | ---------------------------------------------------------------------- |
| `npm.cmd run dev`                 | Vite local development                                                 |
| `npm.cmd test`                    | Math, progression, economy and persistence unit tests                  |
| `npm.cmd run typecheck`           | Strict application TypeScript check                                    |
| `npm.cmd run build`               | Typecheck and production `dist/` build                                 |
| `npm.cmd run build:cloud`         | Validate public config and build live mode with emulators disabled     |
| `npm.cmd run preview`             | Serve the production build locally                                     |
| `npm.cmd ci --prefix functions`   | Install backend scaffold dependencies                                  |
| `npm.cmd run functions:build`     | Compile the separate authoritative backend scaffold                    |
| `npm.cmd run firebase:rules:test` | Run access rules tests with a local demo Firestore emulator (Java 21+) |
| `npm.cmd run firebase:emulators`  | Local Auth/Firestore/Functions preparation, never a real deployment    |

`src/lib/math.ts` owns questions, hints and answer validation. `curriculum.ts` owns validated parent plans, migrations, per-fact review evidence and deterministic selection. `learning.ts` owns durable per-skill evidence. `economy.ts` owns the ledger, issuance limits and reward state machine. `appearance.ts` validates a strict cosmetic field allowlist; `storage.ts` owns demo initialization and persistence. `Art.tsx`, `Companion.tsx` and `PipStudio.tsx` draw, animate and customize Pip without coupling cosmetic actions to the math/economy engines. `App.tsx` connects the experience. `firebase.ts` is a lazy, unused integration boundary; it does not initialize or transmit data in demo mode. The separate `functions/` package is retained legacy scaffolding and is not deployed. In cloud mode, `cloudFirebase.ts` separates parent and child authentication, `cloudRepository.ts` proposes atomic operations, and `firestore.spark.rules` validates every accepted balance, progress, request and approval change on Google’s servers. No arbitrary client balance or role flag is trusted.

Keyboard focus indicators, a skip link, labeled inputs, modal focus containment/Escape dismissal, responsive navigation, large controls and reduced-motion support are included. No timed scoring, public child profiles, full names or birthdays.

See [VALIDATION.md](VALIDATION.md) for executed checks and remaining integration limits, and [PLAN.md](PLAN.md) for milestones.
