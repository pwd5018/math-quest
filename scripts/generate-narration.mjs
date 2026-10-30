// Run: node --experimental-strip-types scripts/generate-narration.mjs D:/Paul/Kokoro
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { lessons, questionFor } from "../src/lib/lessons.ts";
import { narrationKey, spokenDirections } from "../src/lib/narration.ts";

const modelFolder = resolve(process.argv[2] || "D:/Paul/Kokoro");
const entries = [];
for (const lesson of lessons) {
  const texts = [
    lesson.explanation,
    lesson.guided,
    ...lesson.checks.map((e) => questionFor(lesson, e)),
    lesson.takeaway,
  ];
  for (let i = 0; i < texts.length; i++) {
    const original = `${lesson.title}. ${texts[i]}`;
    const key = narrationKey(original);
    if (entries.some((e) => e.key === key && e.original !== original))
      throw new Error("Narration key collision.");
    entries.push({
      key,
      original,
      text: spokenDirections(original),
      filename: `af-heart-${key}.wav`,
    });
  }
}
await mkdir("artifacts", { recursive: true });
await mkdir("public/narration", { recursive: true });
const input = resolve("artifacts/narration-input.json");
await writeFile(input, JSON.stringify(entries, null, 2));
const result = spawnSync(
  resolve(modelFolder, ".venv/Scripts/python.exe"),
  [
    resolve("scripts/generate-narration.py"),
    modelFolder,
    input,
    resolve("public/narration"),
  ],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      PYTHONIOENCODING: "utf-8",
      PYTHONDONTWRITEBYTECODE: "1",
    },
  },
);
if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status || 1);
for (const e of entries) {
  const file = await readFile(resolve("public/narration", e.filename));
  if (file.length < 1000 || file.toString("ascii", 0, 4) !== "RIFF")
    throw new Error(`Missing or invalid audio: ${e.filename}`);
}
const clips = Object.fromEntries(
  entries.map((e) => [e.key, `/narration/${e.filename}`]),
);
await writeFile(
  "src/lib/narrationManifest.ts",
  `// Generated local Kokoro af_heart narration, speed 0.9.\nexport const narrationClips: Record<string, string> = ${JSON.stringify(clips, null, 2)};\n`,
);
console.log(
  `Ready: ${entries.length} direction clips. No model files included in the app.`,
);
