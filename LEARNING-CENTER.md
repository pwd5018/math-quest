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

## Device notes and earlier saves

Version 2 notes store bounded exploration, supported-check and independent-check counts per known lesson ID under a profile-scoped localStorage key. Separate observations coexist; no single check is called mastery. Unknown IDs/fields and invalid counters are discarded. Storage failure leaves the lessons usable with a visible notice. These notes are device-only, are not secure assessments, and are separate from Firebase wallet/mastery/rewards.

The original combined-picnic notes remain under their original version 1 key. An expandable legacy summary displays them without falsely crediting the eight new concepts. No prior record is deleted or silently reassigned.

## Interaction and sound

Every activity has labelled keyboard/touch controls. Object and number-line interactions remain usable without dragging. Number-line scrolling is contained inside the model; mobile layouts stack cards and groups. Pip respects quiet-motion settings. Written guidance and diagrams remain available without sound.

**Read aloud** prefers bundled Kokoro Heart (`af_heart`, speed 0.9) clips for all eight lessons' demonstrations, guided directions, two check prompts and wrap-ups: 40 recordings. Clips are generated locally using the owner's existing installation in `D:/Paul/Kokoro`; no model, Python runtime or API key is included in the browser. Content keys prevent edited directions from playing stale audio. Arithmetic symbols are expanded into spoken words before synthesis.

If a clip is absent or fails, the reader falls back to an installed local English browser voice. Playback requires an explicit click and cancels on step change, exit, replay or mute, including pending playback failures. No microphone or external speech API is used at runtime. Audio is served as normal Hosting assets; offline use requires prior download/cache. Human audio and physical-device acceptance remain owner checks.

To regenerate changed directions after editing lesson text, run `node --experimental-strip-types scripts/generate-narration.mjs D:/Paul/Kokoro`. It uses `.venv/Scripts/python.exe`, the model and voices already installed in that folder. Unchanged clips are reused. The generated manifest is written only after every file is valid. The Kokoro model is Apache-2.0 licensed; its ONNX wrapper is MIT licensed. Model/source references: https://huggingface.co/hexgrad/Kokoro-82M and https://github.com/thewh1teagle/kokoro-onnx.

## Structure and next concepts

The catalogue, mathematical prompts/answers, grading and note restoration live in src/lib/lessons.ts. The lesson journey, visual manipulatives and subject catalogue are separate components. No backend/schema/rules changes are required for this local slice.

Next multiplication concepts: turning arrays around, zero/one, breaking apart facts, fact patterns, stories and missing factors. Next division concepts: equal jumps/subtraction, related multiplication facts, special cases, leftovers, story interpretation and missing quantities. Addition/subtraction, place value, fractions, cloud concept history and parent lesson configuration are later expansions. The owner approved production publication on October 30, 2026. Publication uses the existing release-branch GitHub workflow with validation and byte-for-byte Hosting verification; model files remain local.
