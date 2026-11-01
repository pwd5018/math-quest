# Learning Center

Two subject paths contain four concept lessons each. These are foundational lessons, not a complete multiplication/division curriculum.

| Multiplication    | Guided activity                                                        |
| ----------------- | ---------------------------------------------------------------------- |
| Equal groups      | Place and return berries; every group must have the requested amount.  |
| Repeated addition | Match one addend to each equal group.                                  |
| Skip-counting     | Choose successive landings on a horizontal number line; undo jumps.    |
| Rows and columns  | Adjust an array's rows and columns to match the requested arrangement. |

| Division                  | Guided activity                                                                       |
| ------------------------- | ------------------------------------------------------------------------------------- |
| Share equally             | Divide a fixed supply among a known number of groups. Find the amount in each.        |
| Make equal-sized groups   | Add/remove baskets and pack a known amount per group. Find the number of groups.      |
| From sharing to equations | Label total, group count and amount in each; construct the matching sharing equation. |
| Divide with arrays        | Arrange a finite supply in equal rows; find the amount per row.                       |

Every concept follows **Watch Pip → Build together → Try yourself → Connect the idea**. Demonstrations advance through explicit clicks. Two new examples check understanding; retrying or opening an explanation marks that exploration as supported. No timer, coin changes, penalties or practice-mastery writes. Any concept can be replayed without a lock. A correct total in the wrong model does not pass the guided task.

## Practice links

Multiplication/division questions offer **Teach me this** for their respective subject. This records an ordinary practice hint before leaving the question. The subject catalogue opens, allowing the child to choose a concept. Returning retains the run, question, typed answer and hint/retry state. If saving the hint fails, the app does not leave the question. Other practice skills have no misleading link to unrelated lessons.

## Family notes and earlier saves

Firebase mode stores bounded exploration, supported-check and independent-check counts under `familiesV2/{owner}/children/{child}/lessonNotes/{lessonId}`. Live listeners update other approved devices. Each observation has an immutable `lessonEvents/{operationId}` record and updates its concept counter atomically. Stable operation identities prevent retries from counting twice; concurrent counter conflicts are retried only when a permitted read confirms that another event changed the counter. Only the verified owning parent or an approved, unexpired, unrevoked child device can read or record notes. These are observations, not secure assessments, and never award coins or change practice mastery.

Earlier version 2 notes are imported once per browser/profile using stable migration identities. Original version 1 combined-picnic notes are preserved in `lessonImports/{deviceId}` and shown separately, without falsely crediting the eight new concepts. Counts from separate devices are added; old device data remains intact. Demo notes use a separate scope and are not imported into a family profile.

New Firebase observations first enter a profile-scoped localStorage retry queue. Failed saves survive reload; the screen shows pending notes, storage failures and a Retry sync control. LocalStorage is a temporary queue and migration source, not the authoritative cloud history. If browser storage is unavailable, keep the page open until syncing succeeds. The isolated demo still saves only on its current device. Unknown IDs and invalid counters are discarded; queues and counters are bounded.

The owner approved this update October 31, 2026. Its tested Firestore rules were deployed and read back before the app push; Hosting publication uses the existing GitHub workflow. With older rules, ordinary practice still works and Learning Center queues notes with a server-update notice. Reload after rules deployment to reconnect listeners. Existing device notes migrate when Learning Center next opens in that browser/profile; a device that never reopens cannot upload its old notes. See FIREBASE.md for the release sequence.

## Interaction and sound

Every activity has labelled keyboard/touch controls. Object and number-line interactions remain usable without dragging. Number-line scrolling is contained inside the model; mobile layouts stack cards and groups. Pip respects quiet-motion settings. Written guidance and diagrams remain available without sound.

**Read aloud** prefers bundled Kokoro Heart (`af_heart`, speed 0.9) clips for all eight lessons' demonstrations, guided directions, two check prompts and wrap-ups: 40 recordings. Clips are generated locally using the owner's existing installation in `D:/Paul/Kokoro`; no model, Python runtime or API key is included in the browser. Content keys prevent edited directions from playing stale audio. Arithmetic symbols are expanded into spoken words before synthesis.

If a clip is absent or fails, the reader falls back to an installed local English browser voice. Playback requires an explicit click and cancels on step change, exit, replay or mute, including pending playback failures. No microphone or external speech API is used at runtime. Audio is served as normal Hosting assets; offline use requires prior download/cache. Human audio and physical-device acceptance remain owner checks.

To regenerate changed directions after editing lesson text, run `node --experimental-strip-types scripts/generate-narration.mjs D:/Paul/Kokoro`. It uses `.venv/Scripts/python.exe`, the model and voices already installed in that folder. Unchanged clips are reused. The generated manifest is written only after every file is valid. The Kokoro model is Apache-2.0 licensed; its ONNX wrapper is MIT licensed. Model/source references: https://huggingface.co/hexgrad/Kokoro-82M and https://github.com/thewh1teagle/kokoro-onnx.

## Structure and next concepts

The catalogue, mathematical prompts/answers, grading and note restoration live in src/lib/lessons.ts. The lesson journey, visual manipulatives and subject catalogue are separate components. src/lib/useLessonJournal.ts manages device imports and durable pending saves; CloudRepository and firestore.spark.rules provide family persistence and authorization. No paid backend or Functions deployment is required.

Next multiplication concepts: turning arrays around, zero/one, breaking apart facts, fact patterns, stories and missing factors. Next division concepts: equal jumps/subtraction, related multiplication facts, special cases, leftovers, story interpretation and missing quantities. Addition/subtraction, place value, fractions and parent lesson configuration are later expansions. The earlier lessons/narration release was approved October 30, 2026; this persistence update was approved October 31, 2026 with rules deployed first. Publication uses the existing release-branch GitHub workflow with validation and byte-for-byte Hosting verification; model files remain local.
