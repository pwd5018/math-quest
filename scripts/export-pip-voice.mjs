// Optional local preview export; Node 22.6+ with --experimental-strip-types.
import { mkdir, writeFile } from "node:fs/promises";
import { synthesizeSqueak, synthesizeReaction } from "../src/lib/pipVoice.ts";
const sampleRate = 44100;
const samples = synthesizeSqueak(sampleRate);
const wave = Buffer.alloc(44 + samples.length * 2);
wave.write("RIFF", 0);
wave.writeUInt32LE(wave.length - 8, 4);
wave.write("WAVEfmt ", 8);
wave.writeUInt32LE(16, 16);
wave.writeUInt16LE(1, 20);
wave.writeUInt16LE(1, 22);
wave.writeUInt32LE(sampleRate, 24);
wave.writeUInt32LE(sampleRate * 2, 28);
wave.writeUInt16LE(2, 32);
wave.writeUInt16LE(16, 34);
wave.write("data", 36);
wave.writeUInt32LE(samples.length * 2, 40);
samples.forEach((sample, index) =>
  wave.writeInt16LE(Math.round(sample * 0.1 * 32767), 44 + index * 2),
);
await mkdir(new URL("../artifacts/", import.meta.url), { recursive: true });
await writeFile(new URL("../artifacts/pips-squeak.wav", import.meta.url), wave);
process.stdout.write(
  "Wrote artifacts/pips-squeak.wav (local synthesis preview).\n",
);
// In order: soft fox, chirpy fox, mellow fox, robot, woodland sprite.
// Each style says hello, giggles, then sniffs; a short silence separates cues.
const chunks = [];
for (const style of ["soft", "chirpy", "mellow", "robot", "chime"])
  for (const cue of ["hello", "giggle", "sniff"]) {
    chunks.push(synthesizeReaction(sampleRate, style, cue));
    chunks.push(new Float32Array(Math.round(sampleRate * 0.25)));
  }
const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
const preview = Buffer.alloc(44 + total * 2);
wave.copy(preview, 0, 0, 44);
preview.writeUInt32LE(preview.length - 8, 4);
preview.writeUInt32LE(total * 2, 40);
let offset = 44;
for (const chunk of chunks)
  for (const sample of chunk) {
    preview.writeInt16LE(Math.round(sample * 0.1 * 32767), offset);
    offset += 2;
  }
await writeFile(
  new URL("../artifacts/pip-voices-preview.wav", import.meta.url),
  preview,
);
process.stdout.write(
  "Wrote artifacts/pip-voices-preview.wav (five styles: hello, giggle, sniff).\n",
);
